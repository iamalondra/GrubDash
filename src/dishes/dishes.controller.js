const path = require("path");
const orders = require("../data/orders-data");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyHasData(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const findDish = dishes.find((dish) => dish.id === dishId);
  res.locals.dish = findDish;
  if (findDish) {
    return next();
  } else {
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
  }
}

function checkPrice(req, res, next) {
  const dishPrice = req.body.data.price;
  if (!Number.isInteger(dishPrice) || !(dishPrice > 0)) {
    next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  } else {
    return next();
  }
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  const foundDish = res.locals.dish;
  res.json({ data: foundDish });
}

function validateDishId(req, res, next) {
  const dishId = req.body.data.id;
  const urlId = req.params.dishId;
  if (!dishId) {
    return next();
  }
  if (dishId !== urlId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${dishId}, Route: ${urlId}`,
    });
  }
  next();
}

function update(req, res, next) {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.json({ data: foundDish });
}

function list(req, res, next) {
  res.json({ data: dishes });
}

module.exports = {
  create: [
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("price"),
    bodyHasData("image_url"),
    checkPrice,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("price"),
    bodyHasData("image_url"),
    validateDishId,
    checkPrice,
    update,
  ],
  list,
  bodyHasData,
};
