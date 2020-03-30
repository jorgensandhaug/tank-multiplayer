const express = require("express")
const app = express()
const server = require("http").Server(app)
const io = require("socket.io")(server)

app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || 3000

server.listen(PORT)

let sockets = {}
let players = {}
let canvas = {
    width: 1000,
    height: 800
}
let tid = 0



//distance og randomInt funksjoner
const distance = (pos1, pos2) => Math.sqrt(Math.pow(pos2.x-pos1.x, 2) + Math.pow(pos2.y-pos1.y, 2))
const randomInt = (min, max) => Math.random()*(max-min)+min




class Bullet{
    constructor(x, y, dx, dy, radius, fallOff, angle, mode, image, b, damage, playerID){
        this.pos = {x:x, y:y}
        this.startPos = {x:x, y:y}
        this.vel = {x:dx, y:dy}
        this.damage = damage
        this.r = radius
        this.pierces = 0
        this.connectedHunter = undefined
        this.fallOff = fallOff
        this.switch1 = true
        this.switch2 = true
        this.angle = angle
        this.mode = mode
        this.image = image
        this.playerID = playerID

        // inneholder masse verdier for hvor bildet skal tegnes inn
        this.b = b
    }
    update(){
        this.pos.x+=this.vel.x
        this.pos.y+=this.vel.y

        //utenfor canvas:
        if(this.pos.x < 0 || this.pos.x > canvas.width || this.pos.y < 0 || this.pos.y > canvas.height){
            players[this.playerID].bulletArr.splice(players[this.playerID].bulletArr.indexOf(this), 1)
        }
    }
}


class Player{
    constructor(name, speed, gunLength){
        this.name = name
        this.pos = {x: canvas.width/2, y: canvas.height/2}
        this.vel = {x:0, y:0}
        this.r = 14
        this.health = 400
        this.money = 0
        this.angle = 0
        this.gunLength = gunLength
        this.mode = "shotgun"
        this.readyToShoot = true
        this.oldTime = 0
        this.fireRate = 1
        this.bloom = Math.PI/10
        this.shotGunShots = 20
        this.bulletSpeed = 8
        this.bulletRadius = 5
        this.baseDmg = 50
        this.addedDmg = 0
        this.b = {
            SX: 0,
            SY: 0,
            SW: 256,
            SH: 512,
            OX: -8,
            OY: -17,
            W: 256/15,
            H: 512/15
        }

        this.controller = {
            "w": false,
            "a": false,
            "d": false,
            "s": false
        }

        this.mouse = {
            x: 0,
            y: 0
        }

        this.speedMultiple = 1
        this.speed = speed

        //holder styr på alle skudd som har kommet fra denne spiller
        this.bulletArr = []
    }
    
    update(){

        this.pos.x+=this.vel.x
        this.pos.y+=this.vel.y
        this.vel.x*=0.9
        this.vel.y*=0.9

        if(this.controller["w"] && !this.controller["s"] && !this.controller["d"] && !this.controller["a"]){
            this.angle = 0
        }
        else if(this.controller["w"] && this.controller["d"] && !this.controller["a"] && !this.controller["s"]){
            this.angle = Math.PI/4
        }
        else if(this.controller["w"] && this.controller["a"] && !this.controller["d"] && !this.controller["s"]){
            this.angle = -Math.PI/4
        }
        else if(this.controller["s"] && this.controller["a"] && !this.controller["d"] && !this.controller["w"]){
            this.angle = -3*Math.PI/4
        }
        else if(this.controller["s"] && this.controller["d"] && !this.controller["a"] && !this.controller["w"]){
            this.angle = 3*Math.PI/4
        }
        else if(this.controller["s"] && !this.controller["d"] && !this.controller["a"] && !this.controller["w"]){
            this.angle = Math.PI
        }
        else if(this.controller["a"] && !this.controller["d"] && !this.controller["s"] && !this.controller["w"]){
            this.angle = -Math.PI/2
        }
        else if(this.controller["d"] && !this.controller["a"] && !this.controller["s"] && !this.controller["w"]){
            this.angle = Math.PI/2
        }
        else if(this.controller["w"] && this.controller["s"] && !this.controller["a"] && !this.controller["d"]){
            this.angle = Math.PI
        }


        if(this.controller["a"] || this.controller["s"] || this.controller["d"] || this.controller["w"]){
            this.vel.x = Math.cos(this.angle - Math.PI/2) * this.speed * this.speedMultiple
            this.vel.y = Math.sin(this.angle - Math.PI/2) * this.speed * this.speedMultiple
        }
        

        if(this.health <= 0){
            youLose()
        }

        if(this.pos.x < this.r && this.controller["a"]) this.vel.x = 0.01
        if(this.pos.x > canvas.width-this.r && this.controller["d"]) this.vel.x = -0.01
        if(this.pos.y > canvas.height-this.r && this.controller["s"]) this.vel.y = -0.01
        if(this.pos.y < this.r && this.controller["w"]) this.vel.y = 0.01



        //oppdatere posisjon til alle bullets også
        this.bulletArr.forEach( bullet => {
            bullet.update()
        })
    }
}


function updatePlayerObject(){
    io.emit("updatePlayers", players)
}

io.on('connection', socket => {
    console.log("connected: " + socket.id)
    socket.on("register", pInfo => {
        sockets[socket.id] = socket
        players[socket.id] = new Player(pInfo.name, pInfo.speed, pInfo.gunLength)

        socket.emit("msg", `Hei, nå er du koblet på og din socket ligger i systemet`)

        socket.emit("setCanvasSize", canvas)
    //henter kontrollerinput fra spiller
    socket.on("updateController", key => {
        players[socket.id].controller[key.keyName] = key.state
    })

    //henter mouseinput fra spiller
    socket.on("updateMouse", data => {
        players[socket.id]["mouse"] = data
    })

    //venter på at spiller skal skyte
    socket.on("singleFire", () => {
        const pp = players[socket.id]
        mouseIsPressed = true
  
        let deltaX = pp.mouse.x-pp.pos.x
        let deltaY = pp.mouse.y-pp.pos.y
        let phi = Math.atan2(deltaY, deltaX)

        //shotgunskudd
        if(pp.mode == "shotgun" && tid - pp.oldTime >= 0.75/pp.fireRate){
                // playAudio(shotgunAudio)
                pp.oldTime = tid
                let tempNumberOfShots = 0
                let shotgunInterval = setInterval(() => {
                    tempNumberOfShots += 1

                    //spredning på kulene
                    let tempPhi = randomInt(phi-pp.bloom, phi+pp.bloom)
                    pp.bulletArr.push(new Bullet(pp.pos.x + Math.cos(tempPhi)*(pp.gunLength-35), pp.pos.y + Math.sin(tempPhi)*(pp.gunLength-35), Math.cos(tempPhi)*pp.bulletSpeed + pp.vel.x*0.25, Math.sin(tempPhi)*pp.bulletSpeed + pp.vel.y*0.25, pp.bulletRadius, true, tempPhi, pp.mode, pp.bulletImg, pp.b, pp.baseDmg + pp.addedDmg, socket.id))
                    if(tempNumberOfShots == pp.shotGunShots){
                        clearInterval(shotgunInterval)
                    }
                }, 2.5)
            }
        else{
            //sniperskudd
            if(pp.mode == "sniper" && tid - pp.oldTime >= 0.75/pp.fireRate){
                pp.readyToShoot = true; 
                // playAudio(shotgunAudio); 
                pp.oldTime = tid
            }
                
            else if(pp.mode == "pistol" || pp.mode == "smg") {
                // playAudio(pistolAudio)
                pp.readyToShoot = true
            }
            else if(pp.mode == "lmg"){
                // playAudio(lmgAudio)
                pp.readyToShoot = true
            }
            if(pp.readyToShoot) pp.bulletArr.push(new Bullet(pp.pos.x + Math.cos(phi)*(pp.gunLength-35), pp.pos.y + Math.sin(phi)*(pp.gunLength-35), Math.cos(phi)*pp.bulletSpeed + pp.vel.x*0.25, Math.sin(phi)*pp.bulletSpeed + pp.vel.y*0.25, pp.bulletRadius, false, phi, pp.mode, pp.bulletImg, pp.b, pp.baseDmg + pp.addedDmg, socket.id))
        }
        pp.readyToShoot = false
    })

    //fjerner spiller når han disconnecter
    socket.on("disconnect", (reason) => {
        console.log(`${players[socket.id].name} has left` )
        delete players[socket.id]
    })


    
    })

    

})

heartBeat = setInterval( ()=>{

    Object.keys(players).forEach( key => {
        players[key].update()
    })

    updatePlayerObject()
    tid += 0.01
}, 10)

    


