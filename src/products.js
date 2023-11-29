const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const app = express();

app.use(express.json());

const productsFilePath = path.join(__dirname, 'productos.json');

async function readJSONFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error al leer el archivo JSON:', error.message);
    return [];
  }
}

async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error al escribir en el archivo JSON:', error.message);
  }
}

let productosDB = [];

async function initializeData() {
  productosDB = await readJSONFile(productsFilePath);
}

initializeData();

function getProductById(productId) {
  return productosDB.find((p) => p.id === productId);
}

const productsRouter = express.Router();

productsRouter.get('/', (req, res) => {
  res.json(productosDB);
});

productsRouter.get('/:pid', (req, res) => {
  const productId = parseInt(req.params.pid);
  const producto = getProductById(productId);

  if (producto) {
    res.json(producto);
  } else {
    res.status(404).json({ mensaje: 'Producto no encontrado' });
  }
});

productsRouter.post('/', async (req, res) => {
  const { title, description, code, price, stock, category, thumbnails } = req.body;

  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios excepto thumbnails' });
  }

  const nuevoProducto = {
    id: productosDB.length + 1,
    title,
    description,
    code,
    price,
    status: true,
    stock,
    category,
    thumbnails: thumbnails || [],
  };

  productosDB.push(nuevoProducto);
  await writeJSONFile(productsFilePath, productosDB);

  res.status(201).json(nuevoProducto);
});

productsRouter.put('/:pid', async (req, res) => {
  const productId = parseInt(req.params.pid);
  const productoIndex = productosDB.findIndex((p) => p.id === productId);

  if (productoIndex !== -1) {
    productosDB[productoIndex] = { ...productosDB[productoIndex], ...req.body };
    await writeJSONFile(productsFilePath, productosDB);
    res.json(productosDB[productoIndex]);
  } else {
    res.status(404).json({ mensaje: 'Producto no encontrado' });
  }
});

productsRouter.delete('/:pid', async (req, res) => {
  const productId = parseInt(req.params.pid);
  const productoIndex = productosDB.findIndex((p) => p.id === productId);

  if (productoIndex !== -1) {
    const productoEliminado = productosDB.splice(productoIndex, 1);
    await writeJSONFile(productsFilePath, productosDB);
    res.json(productoEliminado[0]);
  } else {
    res.status(404).json({ mensaje: 'Producto no encontrado' });
  }
});

module.exports = productsRouter;