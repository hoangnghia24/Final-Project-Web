// Reddit-style interactions for vote buttons and like with long-press
(function() {
    'use strict';

    // Add event listeners for vote buttons
    document.addEventListener('DOMContentLoaded', function() {
        // Vote button handlers
        document.addEventListener('click', function(e) {
            const upvoteBtn = e.target.closest('.vote-btn.upvote');
            const downvoteBtn = e.target.closest('.vote-btn.downvote');
            
            if (upvoteBtn) {
                handleVote(upvoteBtn, 'up');
            } else if (downvoteBtn) {
                handleVote(downvoteBtn, 'down');
            }
        });
    });

    function handleVote(button, direction) {
        const card = button.closest('.reddit-post-card');
        const voteCount = card.querySelector('.vote-count');
        const upvoteBtn = card.querySelector('.vote-btn.upvote');
        const downvoteBtn = card.querySelector('.vote-btn.downvote');
        
        let currentCount = parseInt(voteCount.textContent.replace('k', '000').replace('.', ''));
        
        if (direction === 'up') {
            if (upvoteBtn.classList.contains('active')) {
                // Remove upvote
                upvoteBtn.classList.remove('active');
                currentCount--;
            } else {
                // Add upvote
                upvoteBtn.classList.add('active');
                downvoteBtn.classList.remove('active');
                currentCount++;
            }
        } else {
            if (downvoteBtn.classList.contains('active')) {
                // Remove downvote
                downvoteBtn.classList.remove('active');
                currentCount++;
            } else {
                // Add downvote
                downvoteBtn.classList.add('active');
                upvoteBtn.classList.remove('active');
                currentCount--;
            }
        }
        
        // Format count
        if (currentCount >= 1000) {
            voteCount.textContent = (currentCount / 1000).toFixed(1) + 'k';
        } else {
            voteCount.textContent = currentCount;
        }
    }

})();
