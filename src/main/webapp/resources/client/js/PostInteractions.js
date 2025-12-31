/**
 * PostInteractions.js - Post Interaction System
 * TFT Social Network
 * Features: Likes, Emoji Reactions, Comments, Shares, Saves
 */

(function() {
    'use strict';

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    
    let posts = [];
    let currentUser = {
        id: null,
        username: null,
        avatar: null
    };

    const REACTIONS = {
        like: '👍',
        love: '❤️',
        haha: '😂',
        wow: '😮',
        sad: '😢',
        angry: '😠'
    };

    // Long-press state
    let longPressTimer = null;
    let isLongPress = false;
    const LONG_PRESS_DURATION = 500; // 500ms

    // ============================================
    // INITIALIZATION
    // ============================================
    
    function init() {
        console.log('❤️ Initializing Post Interactions System...');

        // Get current user from localStorage
        currentUser.id = localStorage.getItem('currentUserId') || '1';
        currentUser.username = localStorage.getItem('currentUsername') || 'User';
        currentUser.avatar = localStorage.getItem('currentUserAvatar') || 
            'https://api.dicebear.com/9.x/avataaars/svg?seed=User';

        // Setup event delegation for all post interactions
        setupEventListeners();

        // Load mock posts data
        loadPosts();

        console.log('✅ Post Interactions System initialized!');
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    function setupEventListeners() {
        console.log('🎯 Setting up post interaction listeners...');

        // Use event delegation on document
        document.addEventListener('click', handleDocumentClick);
        
        // Long-press detection for like button
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);
        
        // Close modals on overlay click
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('share-modal-overlay')) {
                closeShareModal();
            }
            if (e.target.classList.contains('likes-modal-overlay')) {
                closeLikesModal();
            }
        });

        // Comment input handlers
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('comment-input')) {
                handleCommentInput(e);
            }
        });

        document.addEventListener('keypress', function(e) {
            if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
                submitComment(e.target);
            }
        });

        console.log('✅ Event listeners setup complete');
    }

    function handleMouseDown(e) {
        const button = e.target.closest('.post-like-btn');
        if (!button) return;

        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            showReactionsPicker(button);
        }, LONG_PRESS_DURATION);
    }

    function handleMouseUp(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    function handleMouseLeave(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    function handleTouchStart(e) {
        const button = e.target.closest('.post-like-btn');
        if (!button) return;

        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            showReactionsPicker(button);
        }, LONG_PRESS_DURATION);
    }

    function handleTouchEnd(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }

    function handleDocumentClick(e) {
        const target = e.target;
        const button = target.closest('button');
        
        if (!button) return;

        // Like button
        if (button.classList.contains('post-like-btn')) {
            handleLikeClick(button, e);
        }
        
        // Comment button
        else if (button.classList.contains('post-comment-btn')) {
            handleCommentButtonClick(button);
        }
        
        // Share button
        else if (button.classList.contains('post-share-btn')) {
            handleShareClick(button);
        }
        
        // Save button
        else if (button.classList.contains('post-save-btn')) {
            handleSaveClick(button);
        }
        
        // Reaction picker items
        else if (button.classList.contains('reaction-item')) {
            handleReactionClick(button);
        }
        
        // View likes - check if clicked on stats left area
        if (!button && target.closest('.post-stats-left')) {
            const statsLeft = target.closest('.post-stats-left');
            // Only trigger if clicked on reactions icons or likes count
            if (target.closest('.post-reaction-icons') || target.classList.contains('post-likes-count')) {
                handleViewLikesClick(statsLeft);
            }
        }
        
        // Comment actions
        else if (button.classList.contains('comment-like-action')) {
            handleCommentLike(button);
        }
        else if (button.classList.contains('comment-reply-action')) {
            handleCommentReply(button);
        }
        
        // Modal close buttons
        else if (button.classList.contains('share-modal-close')) {
            closeShareModal();
        }
        else if (button.classList.contains('likes-modal-close')) {
            closeLikesModal();
        }
        
        // Share modal buttons
        else if (button.classList.contains('share-modal-btn-share')) {
            handleShareSubmit(button);
        }
        else if (button.classList.contains('share-modal-btn-cancel')) {
            closeShareModal();
        }
        
        // Comment send button
        else if (button.classList.contains('comment-send-btn')) {
            const input = button.closest('.comment-input-wrapper').querySelector('.comment-input');
            submitComment(input);
        }
    }

    // ============================================
    // LIKE FUNCTIONALITY
    // ============================================
    
    function handleLikeClick(button, event) {
        // If it was a long press, reactions picker already shown, skip like action
        if (isLongPress) {
            isLongPress = false;
            return;
        }

        const postCard = button.closest('.post-card');
        const postId = postCard.dataset.postId;
        const isLiked = button.classList.contains('liked');

        if (isLiked) {
            // Unlike
            unlikePost(postId, button);
        } else {
            // Quick like with default reaction
            likePost(postId, 'like', button);
            createFlyingHeart(event.clientX, event.clientY);
        }
    }

    function likePost(postId, reaction, button) {
        console.log(`👍 Liking post ${postId} with reaction: ${reaction}`);

        // Update button state
        button.classList.add('liked');
        const icon = button.querySelector('svg');
        const text = button.querySelector('span');
        
        // Update icon and text based on reaction
        if (reaction === 'like') {
            text.textContent = 'Thích';
        } else if (reaction === 'love') {
            text.textContent = 'Yêu thích';
            button.style.color = '#ff4757';
        } else if (reaction === 'haha') {
            text.textContent = 'Haha';
            button.style.color = '#ffd93d';
        } else if (reaction === 'wow') {
            text.textContent = 'Wow';
            button.style.color = '#ffc107';
        } else if (reaction === 'sad') {
            text.textContent = 'Buồn';
            button.style.color = '#64b5f6';
        } else if (reaction === 'angry') {
            text.textContent = 'Phẫn nộ';
            button.style.color = '#ff6b6b';
        }

        // Update post stats
        updatePostLikesCount(postId, 1, reaction);

        // Simulate API call
        setTimeout(() => {
            console.log(`✅ Post ${postId} liked successfully`);
        }, 300);
    }

    function unlikePost(postId, button) {
        console.log(`💔 Unliking post ${postId}`);

        // Update button state
        button.classList.remove('liked');
        button.style.color = '';
        const text = button.querySelector('span');
        text.textContent = 'Thích';

        // Update post stats
        updatePostLikesCount(postId, -1);

        // Simulate API call
        setTimeout(() => {
            console.log(`✅ Post ${postId} unliked successfully`);
        }, 300);
    }

    function updatePostLikesCount(postId, delta, reaction = null) {
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postCard) return;

        const likesCountElement = postCard.querySelector('.post-likes-count');
        if (!likesCountElement) return;

        let currentCount = parseInt(likesCountElement.textContent) || 0;
        currentCount += delta;
        
        if (currentCount < 0) currentCount = 0;

        likesCountElement.textContent = currentCount;

        // Update reaction icons
        if (reaction && delta > 0) {
            addReactionIcon(postCard, reaction);
        }
    }

    function addReactionIcon(postCard, reaction) {
        const reactionIconsContainer = postCard.querySelector('.post-reaction-icons');
        if (!reactionIconsContainer) return;

        // Check if reaction icon already exists
        const existingIcon = reactionIconsContainer.querySelector(`.reaction-${reaction}`);
        if (existingIcon) return;

        const reactionIcon = document.createElement('div');
        reactionIcon.className = `post-reaction-icon reaction-${reaction}`;
        reactionIcon.textContent = REACTIONS[reaction];
        reactionIconsContainer.appendChild(reactionIcon);
    }

    // ============================================
    // REACTIONS PICKER
    // ============================================
    
    function showReactionsPicker(likeButton) {
        console.log('😊 Showing reactions picker...');

        // Remove existing picker
        const existingPicker = document.querySelector('.reactions-picker');
        if (existingPicker) {
            existingPicker.remove();
        }

        // Create reactions picker
        const picker = document.createElement('div');
        picker.className = 'reactions-picker show';
        picker.innerHTML = `
            <button class="reaction-item" data-reaction="like" data-label="Thích">👍</button>
            <button class="reaction-item" data-reaction="love" data-label="Yêu thích">❤️</button>
            <button class="reaction-item" data-reaction="haha" data-label="Haha">😂</button>
            <button class="reaction-item" data-reaction="wow" data-label="Wow">😮</button>
            <button class="reaction-item" data-reaction="sad" data-label="Buồn">😢</button>
            <button class="reaction-item" data-reaction="angry" data-label="Phẫn nộ">😠</button>
        `;

        likeButton.style.position = 'relative';
        likeButton.appendChild(picker);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (picker.parentNode) {
                picker.classList.remove('show');
                setTimeout(() => picker.remove(), 300);
            }
        }, 5000);
    }

    function handleReactionClick(button) {
        const reaction = button.dataset.reaction;
        const likeButton = button.closest('.post-like-btn');
        const postCard = likeButton.closest('.post-card');
        const postId = postCard.dataset.postId;

        console.log(`😊 Reacting with: ${reaction}`);

        // Hide picker
        const picker = button.closest('.reactions-picker');
        picker.classList.remove('show');
        setTimeout(() => picker.remove(), 300);

        // Apply reaction
        likePost(postId, reaction, likeButton);

        // Create flying emoji
        const rect = button.getBoundingClientRect();
        createFlyingEmoji(REACTIONS[reaction], rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    // ============================================
    // FLYING HEARTS/EMOJIS ANIMATION
    // ============================================
    
    function createFlyingHeart(x, y) {
        const heart = document.createElement('div');
        heart.className = 'flying-heart';
        heart.textContent = '❤️';
        heart.style.left = x + 'px';
        heart.style.top = y + 'px';
        
        document.body.appendChild(heart);

        // Remove after animation
        setTimeout(() => {
            heart.remove();
        }, 1500);
    }

    function createFlyingEmoji(emoji, x, y) {
        const emojiElement = document.createElement('div');
        emojiElement.className = 'flying-heart';
        emojiElement.textContent = emoji;
        emojiElement.style.left = x + 'px';
        emojiElement.style.top = y + 'px';
        
        document.body.appendChild(emojiElement);

        setTimeout(() => {
            emojiElement.remove();
        }, 1500);
    }

    // ============================================
    // COMMENTS FUNCTIONALITY
    // ============================================
    
    function handleCommentButtonClick(button) {
        const postCard = button.closest('.post-card');
        const commentInput = postCard.querySelector('.comment-input');
        
        if (commentInput) {
            commentInput.focus();
            commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function handleCommentInput(e) {
        const input = e.target;
        const sendBtn = input.parentElement.querySelector('.comment-send-btn');
        
        if (input.value.trim()) {
            sendBtn.style.opacity = '1';
            sendBtn.style.pointerEvents = 'all';
        } else {
            sendBtn.style.opacity = '0';
            sendBtn.style.pointerEvents = 'none';
        }
    }

    function submitComment(input) {
        const commentText = input.value.trim();
        if (!commentText) return;

        const postCard = input.closest('.post-card');
        const postId = postCard.dataset.postId;
        const commentsList = postCard.querySelector('.comments-list');

        console.log(`💬 Submitting comment on post ${postId}: ${commentText}`);

        // Create comment element
        const comment = createCommentElement({
            id: Date.now(),
            author: currentUser.username,
            avatar: currentUser.avatar,
            text: commentText,
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: []
        });

        // Add to comments list
        if (commentsList) {
            commentsList.insertBefore(comment, commentsList.firstChild);
        } else {
            // Create comments list if doesn't exist
            const commentsSection = postCard.querySelector('.post-comments-section');
            const newCommentsList = document.createElement('div');
            newCommentsList.className = 'comments-list';
            newCommentsList.appendChild(comment);
            commentsSection.appendChild(newCommentsList);
        }

        // Update comments count
        updateCommentsCount(postId, 1);

        // Clear input
        input.value = '';
        const sendBtn = input.parentElement.querySelector('.comment-send-btn');
        sendBtn.style.opacity = '0';
        sendBtn.style.pointerEvents = 'none';

        // Simulate API call
        setTimeout(() => {
            console.log(`✅ Comment posted successfully`);
        }, 300);
    }

    function createCommentElement(commentData) {
        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        commentItem.dataset.commentId = commentData.id;

        commentItem.innerHTML = `
            <img src="${commentData.avatar}" alt="${commentData.author}" class="comment-avatar">
            <div class="comment-content-wrapper">
                <div class="comment-bubble">
                    <div class="comment-author">${commentData.author}</div>
                    <div class="comment-text">${commentData.text}</div>
                </div>
                <div class="comment-actions">
                    <span class="comment-action comment-like-action">Thích</span>
                    <span class="comment-action comment-reply-action">Trả lời</span>
                    <span class="comment-timestamp">${getTimeAgo(commentData.timestamp)}</span>
                </div>
                ${commentData.replies && commentData.replies.length > 0 ? 
                    `<div class="comment-replies">
                        ${commentData.replies.map(reply => createReplyHTML(reply)).join('')}
                    </div>` : ''}
            </div>
        `;

        return commentItem;
    }

    function createReplyHTML(replyData) {
        return `
            <div class="comment-item" data-comment-id="${replyData.id}">
                <img src="${replyData.avatar}" alt="${replyData.author}" class="comment-avatar">
                <div class="comment-content-wrapper">
                    <div class="comment-bubble">
                        <div class="comment-author">${replyData.author}</div>
                        <div class="comment-text">${replyData.text}</div>
                    </div>
                    <div class="comment-actions">
                        <span class="comment-action comment-like-action">Thích</span>
                        <span class="comment-action comment-reply-action">Trả lời</span>
                        <span class="comment-timestamp">${getTimeAgo(replyData.timestamp)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function updateCommentsCount(postId, delta) {
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postCard) return;

        const commentsCountElement = postCard.querySelector('.post-comments-count');
        if (!commentsCountElement) return;

        let currentCount = parseInt(commentsCountElement.textContent) || 0;
        currentCount += delta;
        
        if (currentCount < 0) currentCount = 0;

        commentsCountElement.textContent = currentCount;
    }

    function handleCommentLike(button) {
        const isLiked = button.classList.contains('liked');
        
        if (isLiked) {
            button.classList.remove('liked');
            button.textContent = 'Thích';
        } else {
            button.classList.add('liked');
            button.textContent = 'Đã thích';
        }

        console.log(`💕 Comment ${isLiked ? 'unliked' : 'liked'}`);
    }

    function handleCommentReply(button) {
        const commentItem = button.closest('.comment-item');
        const commentId = commentItem.dataset.commentId;
        
        console.log(`💬 Reply to comment ${commentId}`);
        
        // TODO: Show reply input box
        alert('Reply functionality - Coming soon!');
    }

    // ============================================
    // SHARE FUNCTIONALITY
    // ============================================
    
    function handleShareClick(button) {
        const postCard = button.closest('.post-card');
        const postId = postCard.dataset.postId;
        
        console.log(`📤 Sharing post ${postId}`);
        showShareModal(postId, postCard);
    }

    function showShareModal(postId, postCard) {
        // Remove existing modal
        const existingModal = document.querySelector('.share-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        // Get post data
        const postAuthor = postCard.querySelector('.post-author-name').textContent;
        const postContent = postCard.querySelector('.post-content').textContent;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'share-modal-overlay show';
        modal.innerHTML = `
            <div class="share-modal">
                <div class="share-modal-header">
                    <h3 class="share-modal-title">Chia sẻ bài viết</h3>
                    <button class="share-modal-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="share-modal-body">
                    <div class="share-options">
                        <div class="share-option" data-share-type="newsfeed">
                            <div class="share-option-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                📝
                            </div>
                            <div class="share-option-label">Chia sẻ ngay</div>
                        </div>
                        <div class="share-option" data-share-type="story">
                            <div class="share-option-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                                📖
                            </div>
                            <div class="share-option-label">Story</div>
                        </div>
                        <div class="share-option" data-share-type="message">
                            <div class="share-option-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                                💬
                            </div>
                            <div class="share-option-label">Tin nhắn</div>
                        </div>
                        <div class="share-option" data-share-type="copy">
                            <div class="share-option-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                                🔗
                            </div>
                            <div class="share-option-label">Sao chép link</div>
                        </div>
                    </div>
                    
                    <div class="share-textarea-wrapper">
                        <textarea class="share-textarea" placeholder="Nói gì đó về bài viết này..."></textarea>
                    </div>
                    
                    <div class="share-post-preview">
                        <strong>${postAuthor}</strong>
                        <p style="margin: 8px 0 0 0; color: #65676b; font-size: 14px;">${postContent}</p>
                    </div>
                </div>
                <div class="share-modal-footer">
                    <button class="share-modal-btn share-modal-btn-cancel">Hủy</button>
                    <button class="share-modal-btn share-modal-btn-share" data-post-id="${postId}">Chia sẻ</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add share option click handlers
        modal.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', function() {
                const shareType = this.dataset.shareType;
                handleShareOptionClick(shareType, postId);
            });
        });
    }

    function handleShareOptionClick(shareType, postId) {
        console.log(`📤 Share option clicked: ${shareType}`);

        if (shareType === 'copy') {
            // Copy link to clipboard
            const link = `${window.location.origin}/post/${postId}`;
            navigator.clipboard.writeText(link).then(() => {
                alert('Đã sao chép link vào clipboard!');
                closeShareModal();
            });
        } else if (shareType === 'message') {
            // Open message dialog
            alert('Chọn người để gửi tin nhắn - Coming soon!');
        } else if (shareType === 'story') {
            alert('Chia sẻ lên Story - Coming soon!');
        }
        // For 'newsfeed', continue to share with caption
    }

    function handleShareSubmit(button) {
        const postId = button.dataset.postId;
        const caption = document.querySelector('.share-textarea').value.trim();
        
        console.log(`📤 Submitting share for post ${postId} with caption: ${caption}`);

        // Update shares count
        updateSharesCount(postId, 1);

        // Close modal
        closeShareModal();

        // Show success message
        setTimeout(() => {
            alert('✅ Đã chia sẻ bài viết!');
        }, 300);
    }

    function closeShareModal() {
        const modal = document.querySelector('.share-modal-overlay');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    function updateSharesCount(postId, delta) {
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postCard) return;

        const sharesCountElement = postCard.querySelector('.post-shares-count');
        if (!sharesCountElement) return;

        let currentCount = parseInt(sharesCountElement.textContent) || 0;
        currentCount += delta;
        
        if (currentCount < 0) currentCount = 0;

        sharesCountElement.textContent = currentCount;
    }

    // ============================================
    // SAVE/BOOKMARK FUNCTIONALITY
    // ============================================
    
    function handleSaveClick(button) {
        const postCard = button.closest('.post-card');
        const postId = postCard.dataset.postId;
        const isSaved = button.classList.contains('saved');

        if (isSaved) {
            unsavePost(postId, button, postCard);
        } else {
            savePost(postId, button, postCard);
        }
    }

    function savePost(postId, button, postCard) {
        console.log(`🔖 Saving post ${postId}`);

        button.classList.add('saved');
        postCard.classList.add('saved');
        
        const text = button.querySelector('span');
        if (text) text.textContent = 'Đã lưu';

        // Simulate API call
        setTimeout(() => {
            console.log(`✅ Post ${postId} saved successfully`);
        }, 300);
    }

    function unsavePost(postId, button, postCard) {
        console.log(`🗑️ Unsaving post ${postId}`);

        button.classList.remove('saved');
        postCard.classList.remove('saved');
        
        const text = button.querySelector('span');
        if (text) text.textContent = 'Lưu';

        // Simulate API call
        setTimeout(() => {
            console.log(`✅ Post ${postId} unsaved successfully`);
        }, 300);
    }

    // ============================================
    // VIEW LIKES LIST
    // ============================================
    
    function handleViewLikesClick(element) {
        const postCard = element.closest('.post-card');
        const postId = postCard.dataset.postId;
        
        console.log(`👁️ Viewing likes for post ${postId}`);
        showLikesModal(postId);
    }

    function showLikesModal(postId) {
        // Remove existing modal
        const existingModal = document.querySelector('.likes-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        // Generate mock likes data
        const likesData = generateMockLikes(15);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'likes-modal-overlay show';
        modal.innerHTML = `
            <div class="likes-modal">
                <div class="likes-modal-header">
                    <div class="likes-modal-tabs">
                        <div class="likes-tab active" data-tab="all">
                            Tất cả <span class="likes-tab-count">${likesData.length}</span>
                        </div>
                        <div class="likes-tab" data-tab="love">
                            ❤️ <span class="likes-tab-count">${Math.floor(likesData.length / 3)}</span>
                        </div>
                        <div class="likes-tab" data-tab="haha">
                            😂 <span class="likes-tab-count">${Math.floor(likesData.length / 4)}</span>
                        </div>
                    </div>
                    <button class="likes-modal-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="likes-modal-body">
                    <div class="likes-list">
                        ${likesData.map(like => createLikeItemHTML(like)).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function createLikeItemHTML(likeData) {
        const isFriend = Math.random() > 0.5;
        return `
            <div class="likes-list-item">
                <div style="position: relative;">
                    <img src="${likeData.avatar}" alt="${likeData.name}" class="likes-list-avatar">
                    <div class="likes-list-reaction reaction-${likeData.reaction}">
                        ${REACTIONS[likeData.reaction]}
                    </div>
                </div>
                <div class="likes-list-info">
                    <div class="likes-list-name">${likeData.name}</div>
                    <div class="likes-list-meta">${likeData.mutualFriends > 0 ? `${likeData.mutualFriends} bạn chung` : ''}</div>
                </div>
                <button class="likes-list-action ${isFriend ? 'active' : ''}">
                    ${isFriend ? 'Bạn bè' : 'Thêm bạn bè'}
                </button>
            </div>
        `;
    }

    function closeLikesModal() {
        const modal = document.querySelector('.likes-modal-overlay');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // ============================================
    // MOCK DATA GENERATORS
    // ============================================
    
    function generateMockLikes(count) {
        const names = [
            'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D',
            'Hoàng Văn E', 'Vũ Thị F', 'Đỗ Văn G', 'Bùi Thị H',
            'Đinh Văn I', 'Lý Thị K', 'Mai Văn L', 'Chu Thị M',
            'Đặng Văn N', 'Phan Thị O', 'Võ Văn P'
        ];

        const reactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: names[i] || `User ${i + 1}`,
            avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${names[i] || 'User' + i}`,
            reaction: reactions[Math.floor(Math.random() * reactions.length)],
            mutualFriends: Math.floor(Math.random() * 20)
        }));
    }

    function loadPosts() {
        // This will be called by Home.js or similar
        // Posts are already rendered in HTML, we just attach interactions
        console.log('📝 Posts loaded, interactions ready');
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;
        return `${Math.floor(diffInSeconds / 604800)} tuần`;
    }

    // ============================================
    // INITIALIZE ON DOM READY
    // ============================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(init, 100);
        });
    } else {
        setTimeout(init, 100);
    }

    // Export for external use
    window.PostInteractions = {
        likePost,
        unlikePost,
        savePost,
        unsavePost,
        showShareModal,
        showLikesModal
    };

})();
