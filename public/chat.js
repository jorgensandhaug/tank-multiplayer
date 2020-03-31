const chatMsg = document.getElementById("chat-msg")
const chatInp = document.getElementById("chat-inp")
let chatBubbles = []

socket.on("msg", data => {
    displayMsg(data["message"], data["sender"])
})

function displayMsg(msg, sender){
    let newChatBubble = document.createElement("div")
    newChatBubble.setAttribute("class", "chat-bubble")
    newChatBubble.innerHTML = `<p class='chat-name'>${sender}:</p><p class='chat-message'>${msg}:</p>`
    chatBubbles.push(newChatBubble)
    chatMsg.appendChild(newChatBubble)
}

function sendMsg(msg){
    if(chatInp.value != ""){
        socket.emit("chat-msg", chatInp.value)
        chatInp.value = chatInp.placeholder
        displayMsg(chatInp.value, "Me")
    }
}

window.addEventListener("keydown", (e)=>{
    if(e.keyCode == 13){
        sendMsg()
    }
})
