package com.vn.mxh.controller;

import com.vn.mxh.domain.Comment;
import com.vn.mxh.domain.Post;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.CreateCommentInput;
import com.vn.mxh.domain.dto.CreatePostInput;
import com.vn.mxh.domain.dto.UpdatePostInput;
import com.vn.mxh.domain.enums.PrivacyLevel;
import com.vn.mxh.repository.CommentRepository;
import com.vn.mxh.repository.UserRepository;
import com.vn.mxh.service.PostService; // Import Service
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Controller
public class PostController {

    private final PostService postService; // Sử dụng Service thay vì Repository
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    // Lưu ý: Đã xóa SimpMessagingTemplate và LikeRepository ở đây
    // vì logic đó đã chuyển vào PostService

    public PostController(PostService postService,
            UserRepository userRepository,
            CommentRepository commentRepository) {
        this.postService = postService;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
    }

    // ==========================================
    // 1. TẠO BÀI VIẾT (GỌI SERVICE REALTIME)
    // ==========================================
    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Post createPost(@Argument("input") CreatePostInput input) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PrivacyLevel privacy = input.privacyLevel() != null ? input.privacyLevel() : PrivacyLevel.PUBLIC;

        // Map từ DTO sang Entity
        Post newPost = Post.builder()
                .content(input.content())
                .mediaUrl(input.mediaUrl())
                .mediaType(input.mediaType())
                .feeling(input.feeling())
                .privacyLevel(privacy)
                .user(currentUser)
                .likeCount(0)
                .commentCount(0)
                .build();

        // GỌI SERVICE:
        // Service sẽ lo việc: Lưu DB + Bắn Socket Feed + Bắn Socket Thông báo
        return postService.createPost(newPost);
    }

    // ==========================================
    // 2. CẬP NHẬT BÀI VIẾT
    // ==========================================
    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Post updatePost(@Argument UpdatePostInput input) {
        // Validation quyền chủ bài viết đã được xử lý trong Service (hoặc làm tại đây
        // nếu muốn)
        // Để nhất quán với PostService tôi gửi trước đó, ta gọi hàm update

        return postService.updatePost(
                Long.parseLong(input.id()),
                input.content(),
                input.mediaUrl(),
                input.mediaType(),
                input.privacyLevel());
    }

    // ==========================================
    // 3. XÓA BÀI VIẾT
    // ==========================================
    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Boolean deletePost(@Argument String id) {
        // Logic check quyền và xóa đã có trong Service
        return postService.deletePost(Long.parseLong(id));
    }

    // ==========================================
    // 4. LIKE BÀI VIẾT
    // ==========================================
    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Boolean toggleLikePost(@Argument String postId) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Gọi Service xử lý logic Like/Unlike
        return postService.toggleLike(Long.parseLong(postId), currentUser.getId());
    }

    // ==========================================
    // 5. COMMENT (GIỮ NGUYÊN HOẶC CHUYỂN SERVICE)
    // ==========================================
    // Do file PostService trước chưa có createComment, ta giữ logic này ở
    // Controller
    // để code chạy được ngay.
    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public Comment createComment(@Argument CreateCommentInput input) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();

        // Lưu ý: postService.getPostById nếu có, hoặc dùng repository tạm
        // Ở đây để an toàn và nhanh, ta dùng postService.findById nếu bạn đã thêm,
        // hoặc inject PostRepository chỉ cho hàm này.
        // NHƯNG để sạch code, tôi khuyên bạn thêm hàm getPostById vào PostService.

        // Tạm thời dùng cách gọi gián tiếp hoặc giả định Service có hàm tìm kiếm
        // Hoặc inject PostRepository lại nếu cần thiết (nhưng hạn chế mix).

        // Cách giải quyết nhanh nhất: Thêm findById vào PostService
        Post post = postService.getPostById(Long.parseLong(input.postId())); // Cần thêm hàm này vào Service

        Comment comment = new Comment();
        comment.setContent(input.content());
        comment.setUser(user);
        comment.setPost(post);

        Comment savedComment = commentRepository.save(comment);

        // Update count
        post.setCommentCount(post.getCommentCount() + 1);
        // postRepository.save(post); // Service nên có hàm update hoặc save

        return savedComment;
    }

    @QueryMapping
    public List<Post> getAllPosts() {
        return postService.getAllPosts();
    }

    @QueryMapping
    public List<Comment> getCommentsByPostId(@Argument String postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(Long.parseLong(postId));
    }
}