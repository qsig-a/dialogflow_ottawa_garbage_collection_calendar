// Fulfillment for gathering next pickup for the Ottawa Garbage Collection Calendar
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const moment = require('moment-timezone');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response }); 
 
function GetPickup(agent) {
  	return new Promise((resolve,reject) => {
 	var address = String(agent.parameters.location['street-address']);
	var getAddressIDUrl='https://api.recollect.net/api/areas/Ottawa/services/208/address-suggest?locale=en&q=';
   	var axios = require('axios');
  	var message = "";
   	address = address.split(' ').join('+');
	getAddressIDUrl += address;
  	
    axios.get(getAddressIDUrl)
    	.then((response) => {
        // Checking if more than one address exists
    	    if (response.data[1]) {
                message = "I'm sorry, there's more than one match for your address, please try again later";
              	agent.end(message);
              	resolve();
            }  
            else if ((response.data.length) == 0 ) {
                // No matching addresses
        		message = "I'm sorry, no matching addresses are found, please try again later";
              	agent.end(message);
              	resolve();
            }  
            else {
              	var getPickupEventUrl='https://api.recollect.net/api/places/';
                // Get Place ID
                var place_id = String(response.data[0].place_id);
                // Get items for pickup
                var url = getPickupEventUrl.concat(place_id,'/services/208?locale=en');
                axios.get(url)
                .then((response) => {
                	var itemsJ = response.data.next_event.flags;
                	var day = response.data.next_event.day;
                  	var pckday = moment.tz(day,"America/Toronto").format('dddd');
                    var pck_items = [];
                    for (var key in itemsJ) {
                    	var item =  (itemsJ[key]);
                        var pck_item = item.subject;
                        pck_items.push(pck_item.toLowerCase());
                        }
                  	// Adding day of the week and items with and being the seperator between the 2nd last and last item
                	message = "The next pickup will be on ".concat(pckday,"  and the items will be ",pck_items.join(', ').replace(/, ([^,]*)$/, ' and $1'),".");
					agent.end(message);
                  	resolve();
                    })
                    .catch(err=> {
                  		message = "I'm sorry, there was a problem getting the next pickup, please try again later";
                  		agent.end(message);
                  		resolve();
                });
 			}})
   .catch(err=> {message = "I'm sorry, there was a problem finding your address, please try again later";
                  		agent.end(message);
                  		resolve();
                });
              });
}
let intentMap = new Map();
intentMap.set('GetPickup', GetPickup);
agent.handleRequest(intentMap);
});
