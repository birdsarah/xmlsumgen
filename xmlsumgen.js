MyItems = new Meteor.Collection("theitems");
MySessions = new Meteor.Collection("sessions");

if (Meteor.is_client) {
	
	Meteor.startup(function () {
			//create a session
			newSession();
	 });

   newSession = function(){
   		var user = "guest";
			var d = new Date();
			var thisSession = MySessions.insert({user: user, date: d});
			Session.set("thisSession", thisSession); 
			
		   //reset views
	 		$("#getxmlview").show();
	 		$("#thedataview").hide();
			$("#sideprice").hide();	
		   $("#sidecom").hide();		
	 		$("#sidesessionref").hide();
			$("#retrievesession").show();	 			 		
			$("#sidewelcome").show();	
   	};

	Template.getxml.events = {
		
		/*
		* On click of "process" we convert the xml to json, add to MyItems and change view
		*/
		
		'click .button': function() {
			
			var thisSession = Session.get("thisSession");
			
			//subscribe to items for just this client			
			Meteor.subscribe("theitems", thisSession);	
			Meteor.subscribe("sessions", thisSession);					

         //get XML and use library to turn it to JSON
			var myxml = $("#myXML").val();
         var thejson = $.xml2json(myxml,true);
			
			//initialize loop variables
			var thelength = thejson.input.length;
			var counter = 0;
			
			while(counter < thelength){
				var i = MyItems.insert(thejson.input[counter]);	
				//add session reference
				MyItems.update({_id: i}, {$set : { session : thisSession}});				
				counter++;
				}
         				
			//switch mainviews
			$("#getxmlview").hide();
			$("#thedataview").show();	
				
		   //switch sideviews (initialized by css)
		   $("#sidesessionref").show();
			$("#sidewelcome").hide();	
			$("#retrievesession").hide();	
			
			$("#sideprice").show();	
		   $("#sidecom").show();				
		}	
	};

	Template.retrievesession.events = {
		
		/*
		* On click of "retrieve data" we subscribe to data and switch views and print data in views
		*/		
		
		'click .button': function(){		
			         
         var prevSession = $('.retrievesession').val();
         
			Session.set("thisSession", prevSession);
			Meteor.subscribe("theitems", prevSession);	
			Meteor.subscribe("sessions", prevSession);	
			
			var prev = MySessions.find({_id: prevSession});
			console.log(prev.collection.docs[0]);
		
		   //switch views (initialized by css)	   
		   $("#getxmlview").hide();
			$("#thedataview").show();
			$("#retrievesession").hide();	
			
			Meteor.flush();
			$("#sidesessionref").show();
			$("#sideprice").show();	
		   $("#sidecom").show();	
		   $("#sidewelcome").hide();	
			

		}
	};
	
     
   Template.thedata.events = {
    	'blur .data': function(event) {
			var clickedElement = event.target;
			var clickedID = clickedElement.id;
			var idPrefix = clickedID.substring(0,3); 	
			var recordID = clickedID.substring(3,clickedID.length);			
			var thevalue = $('#'+clickedID).val();

			if ( idPrefix === "pri" ){
				 MyItems.update({_id: recordID}, {$set : { price : thevalue}});
			}
			
			if( idPrefix === "com" ){
				 MyItems.update({_id: recordID}, {$set : { com : thevalue}});
			}
			
			var newcell = "<td class='data' title='click to edit' id=" + clickedID + ">" + thevalue + "</td>";			
			$('#'+clickedID).replaceWith(function(){return newcell});
			
		   replacePriceOutput();
	      replaceComOutput();
			
		},

		'click .data, focus .data': function(event){	
		
			if(Session.get("tabset") !== true){
				thelength = $(".data").length;
				counter = 0;
				while( counter < thelength ){
					$(".data").eq(counter).prop("tabIndex",counter+1);		
					counter++;				
				}
				console.log("tabs are set");
				Session.set("tabset",true);
			}
				
		},
		
	 	'keyup #formbinding':function(){

			//save formbinding to MyItems
		   var thisSession = Session.get("thisSession");
		   var formbind =  $('#formbinding').val();
		   MySessions.update({_id: thisSession}, {$set : { formbind : formbind }});
					
	      replacePriceOutput();
	      replaceComOutput();

		}	
					
	};
	
	Template.thedata.thedata = function() {
		return MyItems.find({});
	};	
	
	Template.thedata.sessioninfo = function(){
		return MySessions.find({});	
	};
	
	Template.sidecom.sessioninfo = function(){
		return MySessions.find({});	
	};
	
	Template.sideprice.sessioninfo = function(){
		return MySessions.find({});	
	};
			
	Template.startover.events = {
		'click .button':function(){
	   //clear session reference & re-subscribe to data
			
	   newSession();
	 		
		}
	};
				
	Template.sidesessionref.sessionref = function(){
			return Session.get("thisSession");
	};		
			
	Template.sidesessionref.events = {
       'click .button':function(){
       	var thisSession = Session.get("thisSession");
       	var deletedata = confirm("Are you sure you want to delete data with session reference: " + thisSession);
			if (deletedata) {
				MyItems.remove({session: thisSession}); 
				MySessions.remove({_id: thisSession}); 
       		}
		
	   //clear session reference & re-subscribe to data
	   newSession();
	   //switch views
			$("#thedataview").hide();
	 		$("#getxmlview").show();
	
		}	
	};
		
		
   replacePriceOutput = function(){
   		var priceval = "";
	      var myitems = MyItems.find({}).fetch();
			var formbind = MySessions.find({_id: Session.get("thisSession")}).fetch()[0].formbind;

			var thelength = myitems.length;
			counter = 0;					
					
			//save the data
			while(counter < thelength){
				var price = myitems[counter].price;	
			
				if( price ){		
				var bind = myitems[counter].bind;
				priceval = priceval + "(/" + formbind + "/" + bind + "*" + price + ")+";
				}

	        	counter++;
	      }	
	
			//remove last +
			priceval = priceval.substring( 0 , priceval.length-1 );	
	
		   var priceout = "<h4 class='priceoutput'><textarea>" + priceval + "</textarea></h4>";

			$('.priceoutput').replaceWith(function(){return priceout});
			
			//save it
		   MySessions.update({_id: Session.get("thisSession")}, {$set : { lastprice : priceval }});

   	};   
   	
   replaceComOutput = function(){
   		var comval = "";
	      var myitems = MyItems.find({}).fetch();
			var formbind = MySessions.find({_id: Session.get("thisSession")}).fetch()[0].formbind;


			var thelength = myitems.length;
			counter = 0;					
					
			//save the data
			while(counter < thelength){
				var com = myitems[counter].com;	
				
				if( com ){
				var bind = myitems[counter].bind;
				comval = comval + "(/" + formbind + "/" + bind + "*" + com + ")+";
				}
				
	        	counter++;
	      }	
	
			//remove last +
			comval = comval.substring( 0 , comval.length-1 );	
			
		   comout = "<h4 class='comoutput'><textarea>" + comval + "</textarea></h4>";
		   
			$('.comoutput').replaceWith(function(){return comout});	
			
			//save it
		   MySessions.update({_id: Session.get("thisSession")}, {$set : { lastcom : comval }});
	
   	};  
   
}


if (Meteor.is_server) {
	
	Meteor.publish("theitems", function(thisSession){
    	return MyItems.find({session: thisSession});
   });
   
   Meteor.publish("sessions", function(thisSession){
    	return MySessions.find({_id: thisSession});
   });
    	
  	Meteor.startup(function () {
    // code to run on server at startup    
    
  	});


}


