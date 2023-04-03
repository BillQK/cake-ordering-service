'use strict'

const AWS = require('aws-sdk')
const sqs = new AWS.SQS({
    region: process.env.region 
});

const DELIVERY_COMPANY_QUEUE = process.env.deliveryCompanyQueue; 
const orderManager = require("./orderManager")
const customerServiceManager = require("./customerServiceManager")

module.exports.deliveryOrder = orderFulfilled => {
    var orderFulfilledPromises = []; 

    for (let order of orderFulfilled) {
        const temp = orderManager.updateOrderForDelivery(order.orderId).then(
            updateOrder => {
                return orderManager.saveOrder(updateOrder).then(() => {
                    return notifyDeliveryCompany(updateOrder);
                });
            });
        orderFulfilledPromises.push(temp)
    };
    return Promise.all(orderFulfilledPromises)
}
module.exports.orderDelivered = (orderId, deliveryCompanyId, orderReview) => {
    return orderManager.updateOrderForDelivery(orderId, deliveryCompanyId).then(
        updatedOrder => {
            return orderManager.saveOrder(updatedOrder).then(
            () => {
                return customerServiceManager.notifyCustomerServiceCompanyForReview(orderId, orderReview);
            });
        });
}
function notifyDeliveryCompany(order) {
    const params = { 
        MessageBody: JSON.stringify(order),
        QueueUrl: DELIVERY_COMPANY_QUEUE
    };   

    return sqs.sendMessage(params).promise();
}

