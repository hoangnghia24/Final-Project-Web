package com.vn.mxh.service;

import com.vn.mxh.domain.Friendship;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.enums.FriendshipStatus;
import com.vn.mxh.domain.enums.Role;
import com.vn.mxh.repository.FriendshipRepository;
import com.vn.mxh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendshipService {

        private final FriendshipRepository friendshipRepository;
        private final UserRepository userRepository;
        private final SimpMessagingTemplate messagingTemplate; // Dùng để bắn WebSocket

        @Transactional
        public Friendship sendFriendRequest(String requesterUsername, Long addresseeId) {
                User requester = userRepository.findByUsername(requesterUsername)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                User addressee = userRepository.findById(addresseeId)
                                .orElseThrow(() -> new RuntimeException("Target user not found"));

                if (requester.getId().equals(addresseeId)) {
                        throw new RuntimeException("Không thể kết bạn với chính mình");
                }

                if (friendshipRepository.findFriendshipBetween(requester, addressee).isPresent()) {
                        throw new RuntimeException("Đã tồn tại mối quan hệ hoặc lời mời");
                }

                Friendship friendship = Friendship.builder()
                                .requester(requester)
                                .addressee(addressee)
                                .status(FriendshipStatus.PENDING)
                                .build();

                Friendship saved = friendshipRepository.save(friendship);

                // --- GỬI THÔNG BÁO CHO NGƯỜI NHẬN ---
                // Gửi vào Topic: /topic/friend-requests/{ID_NGƯỜI_NHẬN}
                messagingTemplate.convertAndSend(
                                "/topic/friend-requests/" + addressee.getId(),
                                "Bạn có lời mời kết bạn mới từ " + requester.getFullName());

                return saved;
        }

        @Transactional
        public Friendship acceptFriendRequest(Long friendshipId, String currentUsername) {
                Friendship friendship = friendshipRepository.findById(friendshipId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời"));

                if (!friendship.getAddressee().getUsername().equals(currentUsername)) {
                        throw new RuntimeException("Bạn không có quyền chấp nhận lời mời này");
                }

                friendship.setStatus(FriendshipStatus.ACCEPTED);
                Friendship saved = friendshipRepository.save(friendship);

                // --- GỬI THÔNG BÁO CHO NGƯỜI GỬI LỜI MỜI ---
                // Gửi vào Topic: /topic/notifications/{ID_NGƯỜI_GỬI}
                // Lúc này 'friendship.getRequester()' là người đã gửi lời mời ban đầu
                messagingTemplate.convertAndSend(
                                "/topic/notifications/" + friendship.getRequester().getId(),
                                friendship.getAddressee().getFullName() + " đã chấp nhận lời mời kết bạn!");

                return saved;
        }

        public List<Friendship> getMyFriendRequests(Long currentUserId) {
                // --- LỖI THƯỜNG GẶP: ---
                // Sai: return friendshipRepository.findByRequesterId... (Đây là lời mời mình
                // gửi đi)

                // ĐÚNG: Phải tìm theo AddresseeId (Lời mời gửi tới mình)
                return friendshipRepository.findAllByAddresseeIdAndStatus(currentUserId, FriendshipStatus.PENDING);
        }

        public List<User> getFriendSuggestions(Long currentUserId) {
                // 1. Lấy tất cả user (trừ admin và bản thân)
                List<User> allUsers = userRepository.findAllByRoleNotAndIdNot(Role.ADMIN, currentUserId);

                // 2. Lấy danh sách những người ĐÃ có quan hệ (Friendship) với mình
                // (Bao gồm: Đang chờ, Đã kết bạn, Đã chặn...)
                List<Friendship> interactions = friendshipRepository.findAllByRequesterIdOrAddresseeId(currentUserId,
                                currentUserId);

                // 3. Tạo một tập hợp (Set) chứa ID của những người này để tra cứu cho nhanh
                Set<Long> interactedUserIds = interactions.stream()
                                .map(f -> f.getRequester().getId().equals(currentUserId) ? f.getAddressee().getId()
                                                : f.getRequester().getId())
                                .collect(Collectors.toSet());

                // 4. Lọc danh sách: Chỉ trả về những user CHƯA có trong danh sách tương tác
                return allUsers.stream()
                                .filter(u -> !interactedUserIds.contains(u.getId()))
                                .collect(Collectors.toList());
        }

        public List<User> getMyFriends(Long currentUserId) {
                List<Friendship> friendships = friendshipRepository.findAllAcceptedFriendships(currentUserId);

                return friendships.stream()
                                .map(f -> {
                                        if (f.getRequester().getId().equals(currentUserId)) {
                                                return f.getAddressee(); // Mình gửi -> Lấy người nhận
                                        } else {
                                                return f.getRequester(); // Người khác gửi -> Lấy người gửi
                                        }
                                })
                                .collect(Collectors.toList());
        }

        // Trong FriendshipService.java
        // Trong file FriendshipService.java

        // Trong FriendshipService.java

        @Transactional
        public void rejectFriendRequest(Long requestId, String currentUsername) {
                Friendship friendship = friendshipRepository.findById(requestId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời!"));

                boolean isRecipient = friendship.getAddressee().getUsername().equals(currentUsername);
                boolean isRequester = friendship.getRequester().getUsername().equals(currentUsername);

                if (!isRecipient && !isRequester) {
                        throw new RuntimeException("Bạn không có quyền xóa lời mời này!");
                }

                friendshipRepository.delete(friendship);
                friendshipRepository.flush();

                // === THÊM ĐOẠN NÀY: Bắn thông báo cập nhật UI ===
                Long userToNotifyId;
                if (isRequester) {
                        // Trường hợp 1: Mình (Requester) HỦY lời mời đã gửi
                        // -> Báo cho người nhận (Addressee) biết để họ load lại danh sách, mất thông
                        // báo đỏ
                        userToNotifyId = friendship.getAddressee().getId();
                } else {
                        // Trường hợp 2: Mình (Addressee) TỪ CHỐI lời mời
                        // -> Báo cho người gửi (Requester) biết để nút của họ đổi lại thành "Thêm bạn
                        // bè"
                        userToNotifyId = friendship.getRequester().getId();
                }

                // Gửi tín hiệu "REFRESH" để bên kia tự load lại API
                messagingTemplate.convertAndSend(
                                "/topic/friend-requests/" + userToNotifyId,
                                "REFRESH_FRIEND_REQUESTS");
                // ================================================
        }
        // Trong FriendshipService.java

        // Trong FriendshipService.java

        @Transactional
        public void unfriend(Long targetUserId, String currentUsername) {
                User currentUser = userRepository.findByUsername(currentUsername)
                                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy người dùng hiện tại"));

                User targetUser = userRepository.findById(targetUserId)
                                .orElseThrow(() -> new RuntimeException("Lỗi: Người bạn này không tồn tại"));

                Friendship friendship = friendshipRepository.findFriendshipBetween(currentUser, targetUser)
                                .orElseThrow(() -> new RuntimeException(
                                                "Hai bạn chưa kết bạn hoặc đã hủy kết bạn rồi!"));

                friendshipRepository.delete(friendship);
                friendshipRepository.flush();

                // === THÊM ĐOẠN NÀY: Bắn thông báo cập nhật UI ===
                // Báo cho người bị hủy kết bạn biết
                messagingTemplate.convertAndSend(
                                "/topic/friend-requests/" + targetUserId,
                                "REFRESH_FRIENDS_LIST");
                // Lưu ý: Ta tận dụng kênh /topic/friend-requests/ để báo tin
                // Vì Frontend đã lắng nghe kênh này và có hàm loadAllFriends() bên trong
                // ================================================
        }

        // Trong FriendshipService.java
        public List<Friendship> getSentFriendRequests(Long currentUserId) {
                return friendshipRepository.findSentRequests(currentUserId);
        }

}