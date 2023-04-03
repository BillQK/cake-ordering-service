'use strict';

const orderManager = require('./orderManager');
const kinesisHelper = require('./kinesisHelper'); 
const cakeProducerManager = require('./cakeProducerManager');
const deliveryManager = require('./deliveryManager')

module.exports.createOrder = async (event) => {

  const body = JSON.parse(event.body);
  const order = orderManager.createOrder(body);

  return orderManager.placeNewOrder(order).then(() => {
    return createResponse(200, order);
  }).catch(error => {
    return createResponse(400, error);
  })
};

module.exports.orderFulfillment = async (event) => {
  const body = JSON.parse(event.body);
  const orderId = body.orderId;
  const fulfillmentId = body.fulfillmentId;

  return orderManager.fulfillOrder(orderId, fulfillmentId).then(() => {
    return createResponse(200, `Order with orderId:${orderId} was sent to delivery`);
  }).catch(error => {
    return createResponse(400, error);
  })
}

module.exports.notifyExternalParties = async (event) => {
  const records = kinesisHelper.getRecords(event); 

  const cakeProducerPromise = getCakeProducerPromise(records);

  const deliveryPromise = getDeliveryPromise(records);

  return Promise.all([cakeProducerPromise, deliveryPromise]).then(() => {
    return 'everything went well'; 
  }).catch(error => {
    return error;
  })

}

module.exports.notifyDeliveryCompany = async (event) => {
  console.log('Let image that we call the company end points'); 

  return 'done';
}

module.exports.orderDelivered = async (event) => {
  const body = JSON.parse(event.body); 
  const orderId = body.orderId; 
  const deliveryCompanyId = body.deliveryCompanyId;
  const orderReview = body.orderReview

  return deliveryManager.orderDelivered(orderId, deliveryCompanyId, orderReview).then(
    ( ) => {
      return createResponse(200, `Order with ${orderId} was delivered successfully by companyId ${deliveryCompanyId}`);
    }).catch(error => {
      return createResponse(400, error);
    })
};

module.exports.notifyCustomerService = async (event) => {
  // Some Http calls 
  console.log('Let imagine that we call the customer service endpoint'); 

  return 'done'; 

};

function getCakeProducerPromise(records) {
  
  const orderPlaced = records.filter(r => r.eventType == "order_placed")

  if (orderPlaced.length >  0) {
    return cakeProducerManager.handlePlacedOrders(orderPlaced);
  }
  else { 
    return null;
  }
};

function getDeliveryPromise(records) {
  const orderFulFilled = records.filter(r => r.eventType == 'order_fulfilled');

  if (orderFulFilled.length > 0) {
    console.log("")
    return deliveryManager.deliveryOrder(orderFulFilled);
  } else {
    return null;
  }
};

function createResponse(statusCode, message) {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };

  return response;
}