const express = require('express')
const ejs = require("ejs")
const url = require("url")
const app = express()
const port = 3000
const fs = require('fs/promises')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')

const storage = multer.memoryStorage()
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 } // Tamaño máximo en bytes (1 MB en este ejemplo)
});

//TODO: '/inici' tendría que ser simplemente '/'.
//TODO: getPostObject() no funciona (o creo que /actionAdd no recibe lo que debería en req :P), peta cuando se intenta sacar el length de un archivo.

//* Página chula para SVGs de iconitos: https://tabler-icons.io


app.set('view engine', 'ejs');
app.use(express.static('public'));

async function getPostObject(req) {
    return new Promise(async (resolve, reject) => {
        let objPost = {};
        // Process files
        if (req.files.length > 0) {
            objPost.files = []
        }
        req.files.forEach(file => {
            objPost.files.push({
                name: file.originalname,
                content: file.buffer
            })
        })
        // Process other form fields
        for (let key in req.body) {
            let value = req.body[key];
            if (!isNaN(value)) { // Check if is a number (example: "2ABC" is not a 2)
                let valueInt = parseInt(value);
                let valueFlt = parseFloat(value);
                if (valueInt && valueFlt) {
                    if (valueInt == valueFlt) objPost[key] = valueInt;
                    else objPost[key] = valueFlt;
                }
            } else {
                objPost[key] = value;
            }
        }
        resolve(objPost);
    });
}

app.get('/add', getAdd);
async function getAdd(req, res) {
    res.render('sites/add', {});
}

app.get('/delete', getDelete);
async function getDelete(req, res) {
    res.render('sites/delete', {});
}

app.post('/actionAdd', upload.array('foto', 1), getActionAdd);
async function getActionAdd(req, res) {
    let arxiu = "./private/productes.json";
    let postData = await getPostObject(req);
    try {
        // Llegir el fitxer JSON
        let dadesArxiu = await fs.readFile(arxiu, { encoding: "utf8" });
        let dades = JSON.parse(dadesArxiu);

        // Guardem la imatge a la carpeta 'public' amb un nom únic
        if (postData.files && postData.files.length > 0) {
            let fileObj = postData.files[0];
            const uniqueID = uuidv4();
            const fileExtension = fileObj.name.split(".").pop();
            let filePath = `${uniqueID}.${fileExtension}`;
            await fs.writeFile("./public/imgs/" + filePath, fileObj.content);

            // Guardem el nom de l'arxiu a la propietat 'imatge' de l'objecte
            postData.image = filePath;
            dades.sort((a, b) => {
                if (a.id < b.id) return -1;
            });
            let newID = dades[dades.length-1].id + 1;
            
            // Nou id de producte:
            postData.id = newID;
            // Eliminem el camp 'files' perquè no es guardi al JSON
            delete postData.files;
        }
        dades.push(postData); // Afegim el nou objecte (que ja té el nou nom d’imatge)
        let textDades = JSON.stringify(dades, null, 4); // Ho transformem a cadena de text (per guardar-ho en un arxiu)
        await fs.writeFile(arxiu, textDades, { encoding: "utf8" }); // Guardem la informació a l’arxiu
        res.render('sites/addAction', { item: postData });
    } catch (error) {
        console.error(error);
        res.send("Error al afegir les dades");
    }
}

app.get('/edit', getEdit);
async function getEdit(req, res) {
    let query = url.parse(req.url, true).query;

    let arxiu = "./private/productes.json";
    let dadesArxiu = await fs.readFile(arxiu, { encoding: "utf8" });
    let dades = JSON.parse(dadesArxiu);

    let producte = {};
    id = query.id;
    for (let i = 0; i < dades.length; i++) {
        if (dades[i].id == query.id) {
            producte = dades[i]
        }
    }
    res.render('sites/edit', producte);
}

app.post('/actionEdit', upload.array('foto', 1), getActionEdit);
async function getActionEdit(req, res) {
    let arxiu = "./private/productes.json";
    let postData = await getPostObject(req);
    try {
        // Llegir el fitxer JSON
        let dadesArxiu = await fs.readFile(arxiu, { encoding: "utf8" });
        let dades = JSON.parse(dadesArxiu);

        // Guardem la imatge a la carpeta 'public' amb un nom únic
        if (postData.files && postData.files.length > 0) {
            let fileObj = postData.files[0];
            const uniqueID = uuidv4();
            const fileExtension = fileObj.name.split(".").pop();
            let filePath = `${uniqueID}.${fileExtension}`;
            await fs.writeFile("./public/imgs/" + filePath, fileObj.content);

            // Guardem el nom de l'arxiu a la propietat 'imatge' de l'objecte
            postData.image = filePath;
            dades.sort((a, b) => {
                if (a.id < b.id) return -1;
            });
            // Eliminem el camp 'files' perquè no es guardi al JSON
            delete postData.files;
        }
        console.log(postData)
        for (let i = 0; i < dades.length; i++) {
            if (dades[i].id == postData.id) {
                await fs.unlink("./public/imgs/" + dades[i].image)
                dades[i] = postData; // Afegim el nou objecte (que ja té el nou nom d’imatge)
            }
        }
        let textDades = JSON.stringify(dades, null, 4); // Ho transformem a cadena de text (per guardar-ho en un arxiu)
        await fs.writeFile(arxiu, textDades, { encoding: "utf8" }); // Guardem la informació a l’arxiu
        res.render('sites/editAction', { item: postData });
    } catch (error) {
        console.error(error);
        res.send("Error al afegir les dades");
    }
}


app.get('/', getInici)
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