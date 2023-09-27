const express = require('express')
const ejs = require("ejs")
const url = require("url")
const app = express()
const port = 3000
const fs = require('fs/promises')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')

const storage = multer.memoryStorage()
const upload = multer({storage: storage})

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/inici', getInici)
async function getInici(req, res) {
    let query = url.parse(req.url, true).query;
    let noms = [];
    try {
        // Llegir el fitxer JSON
        let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' })
        let dades = JSON.parse(dadesArxiu)
        // 'noms' conté un array amb els noms de totes les naus ‘
        noms = dades.map(game => { return game.name })
        res.render('sites/inici', { llista: noms })
    } catch (error) {
        console.error(error)
        res.send('Error al llegir el fitxer JSON')
    }
}
// Activar el servidor
const httpServer = app.listen(port, appListen)
function appListen () {
console.log(`Example app listening on: http://localhost:${port}`)
}