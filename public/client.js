const canvas = document.querySelector("canvas")
const c = canvas.getContext("2d")
canvas.style.border = "1px solid black"
// canvas.width = window.innerWidth-400
// canvas.height = window.innerHeight-40


let players = {}

let playerInfo = {
    name: "Jørgen",
    speed: 3,
    gunLength: 63
}

const socket = io.connect('localhost:3000')
socket.emit("register", playerInfo)
socket.on("setCanvasSize", data => {
    canvas.width = data.width
    canvas.height = data.height
})


socket.on("msg", data => {
    console.log(data)
})

socket.on("updatePlayers", data => {
    players = data
})



//definerer alle sprites som skal tegnes
let crosshair = new Image()
crosshair.src = "sprites/crosshair.png"

let splintImg = new Image()
splintImg.src = "sprites/splint.png"

let tankImg = new Image()
tankImg.src = "sprites/smallTank1.png"
let gunImg = new Image()
gunImg.src = "sprites/bigGun1.png"
let sniperBullet = new Image()
sniperBullet.src = "sprites/sniperBullet.png"
let pistolBullet = new Image()
pistolBullet.src = "sprites/pistolBullet.png"
let lmgBullet = new Image()
lmgBullet.src = "sprites/lmgBullet.png"



let healthPotImg = new Image()
healthPotImg.src = "sprites/healthPot.png"


//definerer lydene

// let backgroundMusic = document.querySelector("audio")
// backgroundMusic.volume = 0.03

let pistolAudio = new Audio()
let lmgAudio = new Audio()
let shotgunAudio = new Audio()
let winAudio = new Audio()
let loseAudio = new Audio()
let damagedAudio = new Audio()


pistolAudio.src = "sounds/pistol.mp3"
lmgAudio.src = "sounds/lmg.mp3"
shotgunAudio.src = "sounds/shotgun.mp3"
winAudio.src = "sounds/win.wav"
loseAudio.src = "sounds/lose.wav"
damagedAudio.src = "sounds/damaged.wav"

let audioArr = [pistolAudio, lmgAudio, shotgunAudio, winAudio, loseAudio, damagedAudio]//, backgroundMusic]



pistolAudio.volume = 0.01
lmgAudio.volume = 0.02
shotgunAudio.volume = 0.04
winAudio.volume = 0.01
loseAudio.volume = 0.07
damagedAudio.volume = 0.05


function drawBullet(bullet){
    c.beginPath()
    c.save()

    //sørger for at bildet er rotert slik at bulleten ser ut som den beveger seg i riktig retning
    c.translate(bullet.pos.x, bullet.pos.y)
    c.rotate(bullet.angle + Math.PI/2)
    c.translate(-bullet.pos.x, -bullet.pos.y)

    c.drawImage(pistolBullet, bullet.b.SX, bullet.b.SY, bullet.b.SW, bullet.b.SH, bullet.pos.x + bullet.b.OX, bullet.pos.y + bullet.b.OY, bullet.b.W, bullet.b.H)
    c.restore()
}


function drawPlayer(player){
    c.beginPath()
    c.save()
    c.translate(player.pos.x, player.pos.y)
    c.rotate(player.angle)
    c.translate(-player.pos.x, -player.pos.y)
    c.drawImage(tankImg, 0, 0, 64, 64, player.pos.x-24, player.pos.y-24, 48, 48)
    c.restore()
    c.closePath()


    c.beginPath()
    let deltaX = player.mouse.x-player.pos.x
    let deltaY = player.mouse.y-player.pos.y
    let phi = Math.atan2(deltaY, deltaX)
    c.save()
    c.translate(player.pos.x, player.pos.y)
    c.rotate(phi - 3*Math.PI/2)
    c.translate(-player.pos.x, -player.pos.y)
    c.drawImage(gunImg, 0, 0, 128, 128, player.pos.x - 48, player.pos.y - player.gunLength, 96, 96)
    c.restore()
    c.closePath()


    //tegner alle bullets som hører til spilleren
    player.bulletArr.forEach( bullet => {
        drawBullet(bullet)
    })
    
}







//sender instruksjoner til serveren om hvilke keys som holdes nede
function keyHandling(e){
    let keyName = false
    if(e.keyCode == 65) keyName = "a"
    else if(e.keyCode == 87) keyName = "w"
    else if(e.keyCode == 68) keyName = "d"
    else if(e.keyCode == 83) keyName = "s"

    if(keyName != false){
        let state = e.type == "keydown" ? true : false
        socket.emit("updateController", {
            keyName: keyName,
            state: state
        })
    }
}

//sender museposisjon til serveren
function moveMouse(e){
    socket.emit("updateMouse", {x: e.clientX - 8, y: e.clientY - 8})
}

function singleFire(e){
    moveMouse(e)
    socket.emit("singleFire", "Tror ikke jeg trenger noe data her")
}



window.addEventListener("keyup", keyHandling)
window.addEventListener("keydown", keyHandling)
window.addEventListener("mousemove", moveMouse)
window.addEventListener("mousedown", singleFire)

// document.querySelector("#smallTank").addEventListener("click", startGame)
// document.querySelector("#bigTank").addEventListener("click", startGame)



function animate(){
    c.clearRect(0, 0, canvas.width, canvas.height)


    Object.keys(players).forEach( key => {
        drawPlayer(players[key])
        
    })

    requestAnimationFrame(animate)
}
setTimeout( () => {
    animate()
}, 1000)
