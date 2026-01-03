$(document).ready(function () {

    const newsfeed = $("#newsfeed-container");
    const contentInput = $("#postContentInput");
    const submitBtn = $("#btnSubmitPost");
    const fileInput = $("#fileUploadInput");

    let currentFile = null;
    let stompClient = null;

    const token = localStorage.getItem("accessToken");

    /* =======================
        EVENT
    ======================== */

    contentInput.on("input", toggleSubmit);
    fileInput.on("change", handleFile);
    submitBtn.on("click", submitPost);

    /* =======================
        FUNCTIONS
    ======================== */

    function toggleSubmit() {
        submitBtn.prop("disabled",
            !contentInput.val().trim() && !currentFile);
    }

    function handleFile(e) {
        currentFile = e.target.files[0];
        toggleSubmit();
    }

    async function submitPost() {
        submitBtn.prop("disabled", true).text("Đang đăng...");

        let mediaUrl = "";
        let mediaType = "NONE";

        if (currentFile) {
            mediaType = currentFile.type.startsWith("video") ? "VIDEO" : "IMAGE";
            mediaUrl = URL.createObjectURL(currentFile); // demo
        }

        const mutation = {
            query: `
              mutation {
                createPost(input:{
                  content:"${contentInput.val().replace(/"/g, '\\"')}",
                  mediaUrl:"${mediaUrl}",
                  mediaType:${mediaType}
                }){ id }
              }`
        };

        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            headers: { Authorization: "Bearer " + token },
            data: JSON.stringify(mutation),
            success: () => {
                contentInput.val("");
                fileInput.val("");
                currentFile = null;
            },
            complete: () => {
                submitBtn.text("Đăng");
                toggleSubmit();
            }
        });
    }

    /* =======================
        LOAD POSTS
    ======================== */

    function loadPosts() {
        $.ajax({
            url: "/graphql",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                query: `
                query {
                  getAllPosts {
                    id content mediaUrl mediaType createdAt
                    user { fullName avatarUrl }
                  }
                }`
            }),
            success: res => {
                newsfeed.empty();
                res.data.getAllPosts.forEach(renderPost);
            }
        });
    }

    function renderPost(post) {
        newsfeed.prepend(`
            <div class="feed-card">
                <div class="feed-header">
                    <img src="${post.user.avatarUrl || ''}" class="feed-avatar">
                    <strong>${post.user.fullName}</strong>
                </div>

                <div class="feed-content">${post.content}</div>

                ${post.mediaType !== "NONE" ? `
                <div class="feed-media">
                    ${post.mediaType === "IMAGE"
                    ? `<img src="${post.mediaUrl}">`
                    : `<video src="${post.mediaUrl}" controls></video>`}
                </div>` : ""}
            </div>
        `);
    }

    /* =======================
        WEBSOCKET
    ======================== */

    function connectWS() {
        const socket = new SockJS("/ws");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {
            stompClient.subscribe("/topic/new-posts", msg => {
                renderPost(JSON.parse(msg.body));
            });
        });
    }

    /* INIT */
    loadPosts();
    connectWS();
});
