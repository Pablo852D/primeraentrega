const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const app = express();

app.use(express.json());

const carritosFilePath = path.join(__dirname, 'carrito.json');

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

let carritosDB = [];

async function initializeData() {
  carritosDB = await readJSONFile(carritosFilePath);
}

initializeData();

function getCartById(cartId) {
  return carritosDB.find((c) => c.id === cartId);
}

const cartsRouter = express.Router();

cartsRouter.get('/', (req, res) => {
  res.json(carritosDB);
});

cartsRouter.get('/:cartId', (req, res) => {
  const cartId = req.params.cartId;
  const cart = getCartById(cartId);

  if (cart) {
    res.json(cart);
  } else {
    res.status(404).json({ mensaje: 'Carrito no encontrado' });
  }
});

cartsRouter.get('/:cartId/products', (req, res) => {
  const cartId = req.params.cartId;
  const cart = getCartById(cartId);

  if (cart) {
    const productsInCart = cart.products.map((item) => {
      const product = getProductById(item.productId);
      return { productId: item.productId, quantity: item.quantity, product };
    });

    res.json(productsInCart);
  } else {
    res.status(404).json({ mensaje: 'Carrito no encontrado' });
  }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    try {
      const carritos = await leerJSONFile(carritosFilePath);
  
      const { cid, pid } = req.params;
  
      // Buscar el carrito por ID
      const carrito = carritos.find(c => c.id === cid);
  
      if (!carrito) {
        return res.status(404).json({ mensaje: 'Carrito no encontrado' });
      }
  
      // Verificar si el producto ya existe en el carrito
      const existingProduct = carrito.products.find(p => p.productId === parseInt(pid, 10));
  
      if (existingProduct) {
        // Si el producto ya existe, incrementar la cantidad
        existingProduct.quantity += 1;
      } else {
        // Si el producto no existe, agregarlo al carrito
        carrito.products.push({ productId: parseInt(pid, 10), quantity: 1 });
      }
  
      // Guardar la información actualizada en el archivo carrito.json
      await writeJSONFile(carritosFilePath, carritos);
  
      // Responder con el ID del producto y la cantidad
      res.status(200).json({
        productId: parseInt(pid, 10),
        quantity: existingProduct ? existingProduct.quantity : 1
      });
    } catch (error) {
      console.error('Error al agregar producto al carrito:', error.message);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  });

cartsRouter.put('/:cartId', async (req, res) => {
  const cartId = req.params.cartId;
  const cartIndex = carritosDB.findIndex((c) => c.id === cartId);

  if (cartIndex !== -1) {
    carritosDB[cartIndex] = { ...carritosDB[cartIndex], ...req.body };
    await writeJSONFile(carritosFilePath, carritosDB);
    res.json(carritosDB[cartIndex]);
  } else {
    res.status(404).json({ mensaje: 'Carrito no encontrado' });
  }
});

cartsRouter.delete('/:cartId', async (req, res) => {
  const cartId = req.params.cartId;
  const cartIndex = carritosDB.findIndex((c) => c.id === cartId);

  if (cartIndex !== -1) {
    const cartEliminado = carritosDB.splice(cartIndex, 1);
    await writeJSONFile(carritosFilePath, carritosDB);
    res.json(cartEliminado[0]);
  } else {
    res.status(404).json({ mensaje: 'Carrito no encontrado' });
  }
});



module.exports = cartsRouter;