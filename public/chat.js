const chatMsg = document.getElementById("chat-msg")
const chatInp = document.getElementById("chat-inp")
let chatBubbles = []

console.log("nå er chat-scriptet lagt til")





function displayMsg(msg, sender){
    let newChatBubble = document.createElement("div")
    newChatBubble.setAttribute("class", "chat-bubble")

    //backgroundcolor på chat-bubbles
    if(sender == "Me") newChatBubble.style.backgroundColor = "green"
    else if(sender == "Server") newChatBubble.style.backgroundColor = "#b11226"
    else newChatBubble.style.backgroundColor = "cadetblue"

    
    newChatBubble.innerHTML = `<p class='chat-name'>${sender}:  </p><p class='chat-message'>${msg}</p>`
    chatBubbles.push(newChatBubble)
    chatMsg.appendChild(newChatBubble)
    chatMsg.scrollTop = 100000
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