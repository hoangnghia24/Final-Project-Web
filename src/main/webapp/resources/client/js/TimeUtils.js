/**
 * TimeUtils.js - Utility functions for displaying relative time
 * Hiển thị thời gian tương đối như "5 phút trước", "2 giờ trước", "3 ngày trước"
 */

$(document).ready(function() {
    console.log('TimeUtils.js loaded');

    // Function to calculate relative time
    window.getRelativeTime = function(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffSeconds < 60) {
            return 'Vừa xong';
        } else if (diffMinutes < 60) {
            return diffMinutes + ' phút trước';
        } else if (diffHours < 24) {
            return diffHours + ' giờ trước';
        } else if (diffDays < 7) {
            return diffDays + ' ngày trước';
        } else if (diffWeeks < 4) {
            return diffWeeks + ' tuần trước';
        } else if (diffMonths < 12) {
            return diffMonths + ' tháng trước';
        } else {
            return diffYears + ' năm trước';
        }
    };

    // Function to update all relative times on the page
    window.updateAllRelativeTimes = function() {
        // Update notification times
        $('.notification-time[data-timestamp]').each(function() {
            const timestamp = $(this).attr('data-timestamp');
            $(this).text(getRelativeTime(timestamp));
        });

        // Update chat message times
        $('.chat-item-time[data-timestamp]').each(function() {
            const timestamp = $(this).attr('data-timestamp');
            $(this).text(getRelativeTime(timestamp));
        });

        // Update feed post times
        $('.feed-time[data-timestamp]').each(function() {
            const timestamp = $(this).attr('data-timestamp');
            $(this).text(getRelativeTime(timestamp));
        });
    };

    // Update relative times every minute
    setInterval(updateAllRelativeTimes, 60000);

    // Initial update when page loads
    updateAllRelativeTimes();
});
