const chatMsg = document.getElementById("chat-msg")
const chatInp = document.getElementById("chat-inp")
let chatBubbles = []

console.log("nå er chat-scriptet lagt til")





function displayMsg(msg, sender){
    let newChatBubble = document.createElement("div")
    newChatBubble.setAttribute("class", "chat-bubble")
    newChatBubble.innerHTML = `<p class='chat-name'>${sender}:</p><p class='chat-message'>${msg}</p>`
    chatBubbles.push(newChatBubble)
    chatMsg.appendChild(newChatBubble)
}

function sendMsg(msg){
    if(chatInp.value != ""){
        socket.emit("chat-msg", chatInp.value)
        displayMsg(chatInp.value, "Me")
        chatInp.value = ""
    }
}


socket.on("msg", data => {
    displayMsg(data["message"], data["sender"])
})




window.addEventListener("keydown", (e)=>{
    if(e.keyCode == 13){
        sendMsg()
    }
})