const path = require("path");
const { bodyHasData } = require("../dishes/dishes.controller");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const findOrder = orders.find((order) => order.id === orderId);
  res.locals.order = findOrder;

  if (findOrder) {
    return next();
  } else {
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  }
}

function orderPending(req, res, next) {
  const findOrder = res.locals.order;
  if (findOrder && findOrder.status === "pending") {
    return next();
  } else {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
}

function checkDishes(req, res, next) {
  const dishes = req.body.data.dishes;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  } else {
    return next();
  }
}

function validateQuantity(req, res, next) {
  const dishes = req.body.data.dishes;
  dishes.forEach((dish, i) => {
    if (
      !dish.quantity ||
      isNaN(dish.quantity) ||
      !Number.isInteger(dish.quantity)
    ) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  return next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  const foundOrder = res.locals.order;
  res.json({ data: foundOrder });
}

function validateStatus(req, res, next) {
  const status = req.body.data.status;
  const validStatuses = ["out-for-delivery", "pending", "delivered"];
  if (!validStatuses.includes(status)) {
    return next({
      status: 400,
      message: "status",
    });
  }
  if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  return next();
}

function validateOrderId(req, res, next) {
  const orderId = req.body.data.id;
  const urlId = req.params.orderId;
  if (!orderId) {
    return next();
  }
  if (orderId !== urlId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${orderId}, Route: ${urlId}.`,
    });
  }
  next();
}

function update(req, res, next) {
  const foundOrder = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}

function destroy(req, res, next) {
  const orderId = req.params.orderId;
  const index = orders.findIndex((order) => orderId === order.id);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

function list(req, res, next) {
  res.json({ data: orders });
}

module.exports = {
  create: [
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    checkDishes,
    validateQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    validateOrderId,
    bodyHasData("status"),
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    checkDishes,
    validateQuantity,
    validateStatus,
    update,
  ],
  destroy: [orderExists, orderPending, destroy],
  list,
};
