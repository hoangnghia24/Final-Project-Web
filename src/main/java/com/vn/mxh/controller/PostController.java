package com.vn.mxh.controller;

import com.vn.mxh.domain.Post;
import com.vn.mxh.domain.User;
import com.vn.mxh.domain.dto.CreatePostInput;
import com.vn.mxh.domain.dto.UpdatePostInput;
import com.vn.mxh.domain.enums.PrivacyLevel;
import com.vn.mxh.repository.PostRepository;
import com.vn.mxh.repository.UserRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate; // Import WS
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import com.vn.mxh.domain.Comment;
import com.vn.mxh.domain.Like;
import com.vn.mxh.domain.dto.CreateCommentInput;
import com.vn.mxh.repository.CommentRepository;
import com.vn.mxh.repository.LikeRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Controller
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate; // Dùng để gửi Socket
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;

    public PostController(PostRepository postRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            LikeRepository likeRepository,
            CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
    }

    // ==========================================
    // 1. TẠO BÀI VIẾT + REALTIME SOCKET
    // ==========================================
    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Post createPost(@Argument("input") CreatePostInput input) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PrivacyLevel privacy = input.privacyLevel() != null ? input.privacyLevel() : PrivacyLevel.PUBLIC;

        Post newPost = Post.builder()
                .content(input.content())
                .mediaUrl(input.mediaUrl()) // URL file
                .mediaType(input.mediaType()) // IMAGE hoặc VIDEO
                .feeling(input.feeling()) // Cảm xúc
                .privacyLevel(privacy)
                .user(currentUser)
                .likeCount(0)
                .commentCount(0)
                .build();

        Post savedPost = postRepository.save(newPost);

        // Gửi bài viết mới đến tất cả client đang nghe topic này
        messagingTemplate.convertAndSend("/topic/new-posts", savedPost);

        return savedPost;
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Post updatePost(@Argument UpdatePostInput input) {
        // 1. Lấy User hiện tại
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        // 2. Tìm bài viết theo ID
        Post post = postRepository.findById(Long.parseLong(input.id()))
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        // 3. Bảo mật: Kiểm tra xem người sửa có phải chủ bài viết không
        if (!post.getUser().getUsername().equals(currentUsername)) {
            throw new RuntimeException("Bạn không có quyền sửa bài viết này!");
        }

        // 4. Cập nhật thông tin
        post.setContent(input.content());
        post.setPrivacyLevel(input.privacyLevel());

        // Cập nhật Media (Ảnh/Video)
        post.setMediaUrl(input.mediaUrl());
        post.setMediaType(input.mediaType());

        // 5. Lưu xuống DB
        return postRepository.save(post);
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    public Boolean deletePost(@Argument String id) {
        // 1. Lấy User hiện tại đang đăng nhập
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        // 2. Tìm bài viết trong DB
        Post post = postRepository.findById(Long.parseLong(id))
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại!"));

        // 3. Kiểm tra quyền: Chỉ chủ bài viết mới được xóa
        if (!post.getUser().getUsername().equals(currentUsername)) {
            throw new RuntimeException("Bạn không có quyền xóa bài viết này!");
        }

        // 4. Xóa bài viết
        postRepository.delete(post);

        return true; // Trả về true nếu xóa thành công
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public Boolean toggleLikePost(@Argument String postId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        Post post = postRepository.findById(Long.parseLong(postId))
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Kiểm tra xem đã like chưa
        var existingLike = likeRepository.findByUserAndPost(user, post);

        if (existingLike.isPresent()) {
            // Nếu đã like -> Xóa like (Unlike)
            likeRepository.delete(existingLike.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1)); // Giảm count
            postRepository.save(post);
            return false; // Trả về false (đã unlike)
        } else {
            // Nếu chưa like -> Tạo like mới
            Like newLike = Like.builder().user(user).post(post).build();
            likeRepository.save(newLike);
            post.setLikeCount(post.getLikeCount() + 1); // Tăng count
            postRepository.save(post);

            // TODO: Gửi thông báo cho chủ bài viết (Làm sau)
            return true; // Trả về true (đã like)
        }
    }

    @MutationMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public Comment createComment(@Argument CreateCommentInput input) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        Post post = postRepository.findById(Long.parseLong(input.postId()))
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Tạo Comment
        Comment comment = new Comment();
        comment.setContent(input.content());
        comment.setUser(user);
        comment.setPost(post);

        Comment savedComment = commentRepository.save(comment);

        // Tăng số lượng comment trong Post
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        return savedComment;
    }

    @QueryMapping
    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    @QueryMapping
    public List<Comment> getCommentsByPostId(@Argument String postId) {
        // Gọi repository lấy list comment, sắp xếp cũ nhất lên trước
        return commentRepository.findByPostIdOrderByCreatedAtAsc(Long.parseLong(postId));
    }
}