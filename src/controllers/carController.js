// src/controllers/carController.js
const db = require('../db');

// Health Check
const healthCheck = (req, res) => {
  return res.status(200).json({ message: 'Sucesso' });
};

// Listar Carros com filtros opcionais
const listCars = async (req, res) => {
  try {
    const { brand, model, year } = req.query;
    let query = `
      SELECT cars.*, brands.name AS brand_name
      FROM cars
      JOIN brands ON cars.brand_id = brands.id
      WHERE 1=1
    `;
    const values = [];

    if (brand) {
      values.push(`%${brand}%`);
      query += ` AND brands.name ILIKE $${values.length}`;
    }

    if (model) {
      values.push(`%${model}%`);
      query += ` AND cars.model ILIKE $${values.length}`;
    }

    if (year) {
      values.push(year);
      query += ` AND cars.year = $${values.length}`;
    }

    const result = await db.query(query, values);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao listar carros:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Adicionar um novo Carro
const addCar = async (req, res) => {
  try {
    const { model, year, price, features, images, brand } = req.body;

    if (!model || !year || !price || !brand) {
      return res.status(400).json({ message: 'Model, year, price e brand são obrigatórios' });
    }

    // Verificar se a marca existe, se não, criar
    let brandResult = await db.query('SELECT * FROM brands WHERE name ILIKE $1', [brand]);
    let brandId;

    if (brandResult.rows.length === 0) {
      const insertBrand = await db.query('INSERT INTO brands (name) VALUES ($1) RETURNING id', [brand]);
      brandId = insertBrand.rows[0].id;
    } else {
      brandId = brandResult.rows[0].id;
    }

    const insertCar = await db.query(
      `INSERT INTO cars (model, year, price, features, images, brand_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [model, year, price, features, images, brandId]
    );

    return res.status(201).json(insertCar.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar carro:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar um Carro existente
const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const { model, year, price, features, images, brand } = req.body;

    // Verificar se o carro existe
    const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [id]);
    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Carro não encontrado' });
    }

    let brandId = carResult.rows[0].brand_id;

    if (brand) {
      // Verificar se a marca existe, se não, criar
      let brandResult = await db.query('SELECT * FROM brands WHERE name ILIKE $1', [brand]);

      if (brandResult.rows.length === 0) {
        const insertBrand = await db.query('INSERT INTO brands (name) VALUES ($1) RETURNING id', [brand]);
        brandId = insertBrand.rows[0].id;
      } else {
        brandId = brandResult.rows[0].id;
      }
    }

    // Atualizar os campos fornecidos
    const updatedModel = model || carResult.rows[0].model;
    const updatedYear = year || carResult.rows[0].year;
    const updatedPrice = price || carResult.rows[0].price;
    const updatedFeatures = features !== undefined ? features : carResult.rows[0].features;
    const updatedImages = images || carResult.rows[0].images;

    const updateQuery = `
      UPDATE cars
      SET model = $1,
          year = $2,
          price = $3,
          features = $4,
          images = $5,
          brand_id = $6
      WHERE id = $7
      RETURNING *
    `;

    const updatedCar = await db.query(updateQuery, [
      updatedModel,
      updatedYear,
      updatedPrice,
      updatedFeatures,
      updatedImages,
      brandId,
      id
    ]);

    return res.status(200).json(updatedCar.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar carro:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Excluir um Carro
const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o carro existe
    const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [id]);
    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Carro não encontrado' });
    }

    await db.query('DELETE FROM cars WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Carro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover carro:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Comparar Carros
const compareCars = async (req, res) => {
  try {
    const { ids } = req.query; // Espera uma lista de IDs separados por vírgula

    if (!ids) {
      return res.status(400).json({ message: 'IDs dos carros são necessários para comparação' });
    }

    const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (idArray.length < 2) {
      return res.status(400).json({ message: 'Pelo menos dois IDs válidos são necessários para comparação' });
    }

    const query = `
      SELECT cars.*, brands.name AS brand_name
      FROM cars
      JOIN brands ON cars.brand_id = brands.id
      WHERE cars.id = ANY($1::int[])
    `;

    const result = await db.query(query, [idArray]);

    if (result.rows.length < 2) {
      return res.status(400).json({ message: 'Pelo menos dois carros encontrados para comparação' });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao comparar carros:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  healthCheck,
  listCars,
  addCar,
  updateCar,
  deleteCar,
  compareCars
};
