'use strict'

const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
    region: process.env.region 
}); 

const CUSTOMER_SERVICE_QUEUE = process.env.customerServiceQueue;


module.exports.notifyCustomerServiceCompanyForReview = (orderId, orderReview) => {
    const review = {
        orderId: orderId,
        orderReview : orderReview, 
        date : Date.now()
    }; 
    const params = { 
        MessageBody: JSON.stringify(review), 
        QueueUrl: CUSTOMER_SERVICE_QUEUE
    };

    return sqs.sendMessage(params).promise(); 
} 

