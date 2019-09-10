var CAV = CAV || {};

$(document).on("mobileinit", function (event, ui) {
    $.mobile.defaultPageTransition = "slide";
});

//handles login page
$(document).delegate("#page-login", "pagebeforecreate", function () {

    app.signInController.init();
    app.signInController.$btnSubmit.off("tap").on("tap", function () {
        app.signInController.onSignInCommand();
    });
});

//this function centers the blockui modal window
$.fn.center = function () {
    this.css("position","absolute");
    this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
    this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
    return this;
}

//handles click event of exit button on all pages
$(document).delegate("#btExit", "click", function (e) {
	e.preventDefault();
	e.stopImmediatePropagation();
		if($.mobile.activePage.attr('id') == 'home'){
		navigator.app.exitApp();
	} else {
		history.back();             
	}
});


function ValidateEmail(email) {
        var expr = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
        return expr.test(email);
}; 

$(document).delegate("#lnkLogout", "click", function(e){
	e.preventDefault();
	e.stopImmediatePropagation();
	
	window.location.href = "index.html";
	//$.mobile.changePage("index.html",
//	{
//      allowSamePageTransition : true,
//      transition              : 'none',
//      showLoadMsg             : false,
//      reloadPage              : true
//    }
//	);
});


//handles login button click event
$(document).delegate("#btLogin", "click", function (e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	$("#btLogin").attr("disabled","disabled");
		
	    if($("#login_name").val() == "")
		{
			swal("","Your user name is required!", "error");
			$("#btLogin").removeAttr("disabled");
			return;
		}
		
		if($("#login_password").val() == "")
		{
			swal("","Your password is required!", "error");
			$("#btLogin").removeAttr("disabled");
			return;
		}
		
		var email = $("#login_name").val();
		var expr = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
		if(!expr.test(email)){
			swal("","Please enter a valid user id.", "error");
			$("#btLogin").removeAttr("disabled");
			return;
		}
				   
	$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
	$('.blockUI.blockMsg').center();
		var dt = '{"username": "' + $("#login_name").val() + '", "password": "' + $("#login_password").val() + '"}';
		$.ajax({
		  type: 'POST',
		  contentType: "application/json; charset=utf-8",
		  url: CAV.Settings.AuthenticateUrl,
		  data: dt,
		  success: function (data) {        	   		  
			  if(JSON.stringify(data.d.Status) == "true"){
				  
				  // Create session. 
				 var today = new Date();				 
				 var expirationDate = new Date();
				 expirationDate.setTime(today.getTime() + CAV.Settings.sessionTimeout);				
				 
				 var userId = $("#login_name").val();

				  CAV.Session.getInstance().set({
					  sessionId: data.d.AgentID, 
					  agentName: data.d.Name,
					  userName: userId,
					  expirationDate: expirationDate
				  });
				  	
				  var isChecked = $('#checkbox1').is(':checked');
					
				  //store username in local storage to aid subsequent logins	
				  if(isChecked){
					window.localStorage.setItem("rememberMe", $("#login_name").val());
            	  }
				  				    
				  if(JSON.stringify(data.d.FirstLogin) == "true"){					
				  	  $.unblockUI();
				      $("#txUserID").val($("#login_name").val());
					  $("#txUserID").attr("readonly","readonly");
					  window.location.href ="screens.html#password-change";
					  return;
				  }
				   
				  $("#btLogin").removeAttr("disabled");
				  $("#login_name").val("");
				  $("#login_password").val("");
				
				  window.location.href = "screens.html#home";
				  $.unblockUI();
				  return;
			  } else {			
				  $("#btLogin").removeAttr("disabled");
				  swal("",JSON.stringify(data.d.StatusMessage), "error");	  
	         	  $.unblockUI();
				  return;
			  }
		  },
		  error: function(jqXHR, exception) {
			  $("#btLogin").removeAttr("disabled");
			  if (jqXHR.status === 0) {
				  swal("","CAV Mobile encountered a problem and could not log you in you. Please verify your device network connection.", "error");
				} 
				//else if (jqXHR.status == 404) {
				//	alert('Requested page not found. [404]');
				//} else if (jqXHR.status == 500) {
				//	alert('Internal Server Error [500].');
				//} else if (exception === 'parsererror') {
				//	alert('Requested JSON parse failed.');
				//} 
				else if (exception === 'timeout') {
					swal("","CAV Mobile encountered a timeout and could not log you in you.", "error");
				} else if (exception === 'abort') {
					swal("","CAV Mobile encountered an abort error and could not log you in you.", "error");
				} else {
					swal("","CAV Mobile encountered a problem and could not log you in you- " + jqXHR.responseText, "error");
				}
			  $.unblockUI();
			  return;
		  }
		});
});


//renders the job trends chart on home page	
$(document).delegate("#home", "pageshow", function () {
	var isActive = CheckSessionActive();
	if(isActive == false)
	{
		window.location.href = "index.html";
		return;
	}
	
	var session = CAV.Session.getInstance().get();
	var dt = '{"agentID": "' + session.sessionId + '"}';
	//alert(dt);
	$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
	$('.blockUI.blockMsg').center();
			$.ajax({
				  type: 'POST',
		      	  contentType: "application/json; charset=utf-8",
				  url: CAV.Settings.TrendsUrl,
				  data:  dt,
				  success: function (resp) {                
			   
					  if(JSON.stringify(resp.d.Status) == "true"){
						  							
					  //pending jobs button		
					  var form = $("#home");
					  $("#lblPendingJobs", form).text("You have " + JSON.stringify(resp.d.PendingCount) + " pending job(s)");
					  var arr = resp.d.Name.split(" ");
					  $("#lblName", form).text("Welcome, " + arr[0]);
					  $("#pCompany", form).text(resp.d.Company);

					  //render chart	
						 var arr = $.map(JSON.parse(resp.d.TrendsData), function(el) { return el; });
						 var chart = new CanvasJS.Chart("chartContainer", {
							  backgroundColor: "#F4F4F4",
							  title: {
							   text: "Jobs status breakdown"
								},
								animationEnabled: false,
								data: [{
								    type: "doughnut",
									startAngle: 60,
									showInLegend: true,
									dataPoints: arr
								}]
							});
							chart.render();
							$.unblockUI();
							return;
					  } else {
						  //todo error redirect
					  }
				  },
				  error: function (e) {
					  swal("","CAV Mobile encountered a problem and could not display this page. Please try again later.", "error");
					  $.unblockUI();
					  history.back(); 
					  return;
				  }
			  });
    });

//handles click event of pending jobs button on homepage	
$(document).delegate("#btJobs", "click", function (e) {
	e.preventDefault();
	e.stopImmediatePropagation();
			$.mobile.navigate("#jobs");
});

$(document).delegate("#btResetCancel", "click", function(e){
	e.preventDefault();
	e.stopImmediatePropagation();
	$.mobile.navigate("#page-login");
});

$(document).delegate("#btChangeCancel", "click", function(e){
	e.preventDefault();
	e.stopImmediatePropagation();
	$.mobile.navigate("#page-login");
});

$(document).delegate("#jobs", "pageload", function(){
	$("#jobsList").listview.listview('refresh');	
});

$(document).delegate("#jobs", "pagebeforeshow", function(){
	$("#jobsList").empty();
});

//populates the pending jobs grid
$(document).delegate("#jobs", "pageshow", function(){
	var isActive = CheckSessionActive();
	if(isActive == false)
	{
		window.location.href = "index.html";
		return;
	}
	
	var session = CAV.Session.getInstance().get();
	var dt = '{"agentID": "' + session.sessionId + '", "status": "0,1"}';
	
	$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
	$('.blockUI.blockMsg').center();
	
	$.ajax({
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		url: CAV.Settings.JobsUrl,
		data: dt,
		success: function(resp){
			if(JSON.stringify(resp.d.Status) == "true"){
				var html = '';
				$.each(resp.d.JobList, function(index, item){
					html += '<li><a href="#feedback?id=' + item.TrxnReference + '" data-ajax="false">' + item.TrxnReference + ', ' + item.CustomerNameFull + '</a></li>';
				});				
				
				$("#jobsList").append($(html));
				$("#jobsList").trigger('create');				
				$("#jobsList").listview('refresh');						
				$("#jobsList").quickPagination({pagerLocation:"bottom",pageSize:"10"});
				
				$.unblockUI();
				return;
			}
			else
			{
				$.unblockUI();
				swal("",JSON.stringify(resp.d.StatusMessage), "error");
				return;
			}			
		},
		error: function(e){
		swal("","CAV Mobile encountered a problem and could not display this page. Please try again later.", "error");
		$.unblockUI();
		history.back();  
		return;
		}
	});
});
	

//initializes the submitfeedback page
$(document).delegate("#feedback", "pagebeforeshow", function(){
	
var isActive = CheckSessionActive();
	if(isActive == false)
	{
		window.location.href = "index.html";
		return;
	}

//$('#txVisitationDate').datetimepicker({
//dayOfWeekStart : 1,
//lang:'en'
//});	

	var form = $("#feedback");					  
	$("#txReference", form).val('')
	$("#txCustName", form).val('');
	$("#txCustAddress", form).val('');
	$("#txCustType", form).val('');
	$("#txAgentName", form).val('');
	$("#txLandmark", form).val('');
	$("#txVisitationDate", form).val('');
	$("#txAddressVisited", form).val('');
	$("#txDescription", form).val('');
	$("#txFurther", form).val('');
	$("#lbLatitude", form).val('');
	$("#lbLongitude", form).val('');
	$("#txPersonMet", form).val('');
	$("#txPersonMetComments", form).val('');
	$("#txLat", form).val('');
	$("#txLong", form).val('');	
	$('select option:first-child').attr("selected", "selected");
	$('#ddlReasons').get(0).selectedIndex = 0;
	$('#ddlReasons').selectmenu("refresh");
	
	var smallImage = document.getElementById('smallImage1');
	//smallImage.style.display = 'none';
	smallImage.src = "img/no-image.png";
	
	var smallImage2 = document.getElementById('smallImage2');
	//smallImage2.style.display = 'none';
	smallImage2.src = "img/no-image.png";	
	
	 getLocation();
//	var smallImage3 = document.getElementById('smallImage3');
//	//smallImage2.style.display = 'none';
//	smallImage3.src = "img/no-image.png";	
});

$(document).delegate("#password-change", "pageshow", function(){
	var session = CAV.Session.getInstance().get();
	
	var form = $("#password-change");					  
	 $("#txUserID", form).val(session.userName);
	 $("#txUserID", form).attr("readonly","readonly");
});

$(document).delegate("#feedback", "pageshow", function(){
		
	$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
	$('.blockUI.blockMsg').center();
	
	$('#rdAnswerYes').attr("checked",false).checkboxradio("refresh");
	$('#rdAnswerNo').attr("checked",false).checkboxradio("refresh");
	$('#rdStatusNo').attr("checked",false).checkboxradio("refresh");
	$('#rdStatusYes').attr("checked",false).checkboxradio("refresh");	
	$('#ddlReasons').get(0).selectedIndex = 0;
	$('#ddlReasons').selectmenu("refresh");
	
	//populate form fields
	var query = $.mobile.urlHistory.getActive().url.split("?")[1];
	query = query.replace("id=","");
		
	$.ajax({
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		url: CAV.Settings.JobDetailUrl,
		data: '{"reference": "' + query + '"}',
		success: function(data){
				  if(JSON.stringify(data.d.Status) == "true"){
					  var form = $("#feedback");
					  $("#txReference", form).val(query)
					  $("#txCustName", form).val(data.d.Job.CustomerNameFull);
					  $("#txCustAddress", form).val(data.d.Job.CustomerAddress1 + ' ' + data.d.Job.CustomerAddress2 + ' ' + data.d.Job.CustomerAddress3);
					  $("#txCustType", form).val(data.d.Job.CustomerType);
					  
					  var session = CAV.Session.getInstance().get();
					  $("#txAgentName").val(session.agentName);
					  
					  if(data.d.Job.CustomerType != "Corporate"){
						  $("#dvPerson1").hide();
						  $("#dvPerson2").hide();
					  }else{						  
							$("#dvPerson1").show();
							$("#dvPerson2").show();	
					  }

					var date = new Date();
					var currentDate = date.getDate();     // Get current date
					var month       = date.getMonth() + 1; // current month
					var year        = date.getFullYear();
					var dt = year + "/" + month + "/" + currentDate;

					var currentTime = new Date();
					var hour = currentTime.getHours();
					var minute  = currentTime.getMinutes();
					var sec  = currentTime.getSeconds();
					var time = hour + ":" + minute + ":" + sec;

					  $('#txVisitationDate').val(dt + " " + time);
					  
					  $.unblockUI();
					  return;
				  }
				  else
				  {
					  $.unblockUI();
					  swal("",JSON.stringify(data.d.StatusMessage), "error");
					  history.back(); 
					  return;
				  }					  
		},
		error: function(e){
			console.log(e.message);
			$.unblockUI();
			swal("","CAV Mobile encountered a problem and could not load this page. Please try again later.", "error");
			history.back(); 
		}
	});	
});


$(document).on("pageinit", "#feedback", function() {
       getLocation();
});


var imageData = "";
//handles click event of submit feedback button
$(document).delegate("#btSubmitFeedback", "click", function (e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	var session = CAV.Session.getInstance().get();
		
	try	
	{
		$("#btSubmitFeedback").attr("disabled","disabled");
	
		if($("#txLandmark").val() == "")
		{
			swal("","Please enter nearest bus-stop/landmark!", "error");
			$("#btSubmitFeedback").removeAttr("disabled");
			return;
		}
		
		if($("#txVisitationDate").val() == "")
		{
			swal("","Please enter Visitation date/time!", "error");
			$("#btSubmitFeedback").removeAttr("disabled");
			return;
		}
		
		if($("#txAddressVisited").val() == "")
		{
			swal("","Please enter Address visited!", "error");
			$("#btSubmitFeedback").removeAttr("disabled");
			return;
		}
		
		if($("#txDescription").val() == "")
		{
			swal("","Please enter Description of address visited!", "error");
			$("#btSubmitFeedback").removeAttr("disabled");
			return;
		}
		
		if($("#txFurther").val() == "")
		{
			swal("","Please enter Further comments/observations!", "error");
			$("#btSubmitFeedback").removeAttr("disabled");
			return;
		}
		
		if(!$("input:radio[name='rdAnswer']").is(":checked"))
		{
			swal("","Please specify if customer resides at the above address!", "error");
			$("#btSubmitFeedback").removeAttr("disabled");
			return;
		}
		
		if(!$("input:radio[name='rdStatus']").is(":checked"))
		{
			swal("","Please specify if address exists or not!", "error");
			$("#btSubmitFeedback").removeAttr("disabled");
			return;
		}
		
		if($("select[name='ddlReasons']")[0].selectedIndex == 0)
		{
			swal("","Please select a reason!", "error");
			$("#btSubmitFeedback").removeAttr("disabled");
			return;
		}
		
		//get location corrdinates
		var lat = window.localStorage.getItem("latitude");
		var longt = window.localStorage.getItem("longitude");
				
		//check if coordinates are set	
		if(lat == null ||  longt == null) {
			$("#btSubmitFeedback").removeAttr("disabled");
			swal("","CAV mobile was unable to detect your location!", "error");
			return;
		}
					
		if(lat.length == 0){
			$("#btSubmitFeedback").removeAttr("disabled");
			swal("","CAV mobile was unable to detect your location (latitude)!", "error");
			return;
		}
		
		if(longt.length == 0){
			$("#btSubmitFeedback").removeAttr("disabled");
			swal("","CAV mobile was unable to detect your location (longitude)!", "error");
			return;
		}
		
		//selected photo URI is in the src attribute (we set this on getPhoto)
		var imageURI = document.getElementById('smallImage1').getAttribute("src");
		if(imageURI.indexOf('no-image') >= 0)
		{
			$("#btSubmitFeedback").removeAttr("disabled");
			swal("","Please select a picture!", "error");
			return;
		}
	
		$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
		$('.blockUI.blockMsg').center();
		
		var arr = $("#txVisitationDate").val().split(" ");
	    var vDate = arr[0];
	    var vTime = arr[1];
		
		//set upload options
		var options = new FileUploadOptions();
		options.fileKey = "file";
		options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);// + ".jpg";
		options.mimeType = "image/jpeg";	
		var params = new Object(); 
		params.fieldagentid = session.sessionId;
		params.customerName =  $("#txCustName").val();
		params.address =  $("#txCustAddress").val();
		params.addressVisited =  $("#txAddressVisited").val();
		params.nearestBusstop =  $("#txLandmark").val();
		params.comments =  $("#txFurther").val();
		params.visitationDate =  vDate;
		params.visitationTime =  vTime;
		params.customerType = $("#txCustType").val();
		var visible = $('#dvPerson1').is(':visible');
		if(visible) {		
			params.personMet =  $("#txPersonMet").val();
			params.personComments =  $("#txPersonMetComments").val();		
		}
		
		params.addressDesc = $("#txDescription").val();
		params.sureOfAddress =  $("input[name='rdAnswer']:checked").val();
		params.reasons = $("#ddlReasons option:selected").text();
		params.recordVerified =  $("input[name='rdStatus']:checked").val();
		params.trxnRef =  $("#txReference").val();
		params.visitingOfficer =  $("#txAgentName").val();
		params.coordinates =  lat + ' ' + longt;

		options.params = params;
		options.chunkedMode = false;
				
	
		var ft = new FileTransfer();
		ft.upload(imageURI, encodeURI(CAV.Settings.FeedbackUrl), win, fail, options);
		
	
//		$.ajax({
//		type: 'POST',
//		contentType: "application/json; charset=utf-8",
//		url: CAV.Settings.FeedbackUrl,
//		data: '{"fieldagentid": "' + session.sessionId + '", "customerName": "' + $("#txCustName").val() + '", "address": "' + $("#txCustAddress").val() + '",
//			   "addressVisited": "' + $("#txAddressVisited").val() + '", "nearestBusstop": "' + $("#txLandmark").val() + '", "comments": "' + $("#txFurther").val() + '",
//			   "visitationDate": "' + $("#txVisitationDate").val() + '", "visitationTime": "' + $("#txVisitationDate").val() + '", "personMet": "' + $("#txOldPassword").val() + '",
//			   "personComments": "' + $("#txUserID").val() + '", "addressDesc": "' + $("#txAddressVisited").val() + '", "sureOfAddress": "' + $("input[name='rdAnswer']:checked").val() + '",
//			   "reasons": "' + $("#ddlReasons").val() + '", "recordVerified": "' + $("input[name='rdStatus']:checked").val() + '", "trxnRef": "' + $("#txReference").val() + '",
//			   "visitingOfficer": "' + $("#txAgentName").val() + '", "coordinates": "' + $("#txOldPassword").val() + '", "picture": "' + imageData + '"}',
//		success: function(data){
//		  if(JSON.stringify(data.d.Status) == "true"){								  
//			  var form = $("#home");
//			  var arr = data.d.Name.split(" ");
//			  $("#lblName", form).text("Welcome, " + arr[0]);
//			  $("#pCompany", form).text(data.d.Company);
//			   
//			  $("#btResetPassword").removeAttr("disabled");
//			  $("#login_name").val("");
//			  $("#login_password").val("");
//		
//			  $.mobile.navigate("#home");					
//			  $.unblockUI();
//			  return;			  
//		  }
//		  else
//		  {
//			  $.unblockUI();
//			  $("#btResetPassword").removeAttr("disabled");
//			  swal("",JSON.stringify(data.d.StatusMessage), "error");
//		  }					  
//		},
//		error: function(e){
//			console.log(e.message);
//			$("#btResetPassword").removeAttr("disabled");
//			$.unblockUI();
//			swal("","CAV Mobile encountered a problem and could not process your request. Please try again later.", "error");
//		}
//	});	
	}
	catch(e) {
		$("#btSubmitFeedback").removeAttr("disabled");
		swal("","CAV Mobile encountered a problem and could not process your request- " + e.message, "error");
    	//alert("Error Message: " + e.message);
    	//alert("Error Name: " + e.name);
    	//alert("Error Code: " + e.number);
	}
});
	

function win(d) {
	 var xml = d.response.replace('<CAVGlobalResponse xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://cav.diamondbank.com/">', '<CAVGlobalResponse>');	  
	 var status = $(xml).find("Status").text();
	 var statusMsg = $(xml).find("StatusMessage").text();
	 
	 if(status == "true"){		
		 var form = $("#feedback");	
		$("#txCustName", form).val('');
		$("#txCustAddress", form).val('');
		$("#txCustType", form).val('');
		$("#txAgentName", form).val('');
		$("#txLandmark", form).val('');
		$("#txVisitationDate", form).val('');
		$("#txAddressVisited", form).val('');
		$("#txDescription", form).val('');
		$("#txFurther", form).val('');
		$("#lbLatitude", form).val('');
		$("#lbLongitude", form).val('');
		$("#txPersonMet", form).val('');
		$("#txPersonMetComments", form).val('');
		$('input[name=rdAnswer]').attr('checked',false);
		$('input[name=rdStatus]').attr('checked',false);
		$("#txLat").val('');
        $("#txLong").val('');
		$('select option:first-child').attr("selected", "selected");
		$('#ddlReasons').prop('selectedIndex',0);
		var smallImage = document.getElementById('smallImage1');
		smallImage.src = "img/no-image.png";
		
			//swal("", "Your feedback has been submitted successfully!", "success");
//			$("#txReference", form).val('')
//			$("#btSubmitFeedback").removeAttr("disabled");	
//			$.unblockUI();	
//			$.mobile.navigate("#jobs");
		
		var imageURI = document.getElementById('smallImage2').getAttribute("src");
		if(imageURI.indexOf('no-image') >= 0)
		{	
			swal("", "Your feedback has been submitted successfully!", "success");
			$("#txReference", form).val('');
			$("#btSubmitFeedback").removeAttr("disabled");	
			$.unblockUI();	
			$.mobile.navigate("#jobs");
		}
		else
		{	
			var session = CAV.Session.getInstance().get();
			try
			{
			  var imagefile = imageURI; 
			  var ft = new FileTransfer();                     
			  var options = new FileUploadOptions();                      
			  options.fileKey= "file";                      
			  options.fileName = imagefile.substr(imagefile.lastIndexOf('/') + 1);// + ".jpg";
			  options.mimeType="image/jpeg";  
			  var params = new Object();
			  params.fieldagentid = session.sessionId;		
			  params.trxnRef = $("#txReference").val();	
			  params.mode = "2";                     
			  options.params = params;
			  options.chunkedMode = false;                       
			  ft.upload(imagefile, encodeURI(CAV.Settings.PicUploadUrl), win2, fail, options);  
				}
		  catch(e) 
		  	{
				swal("", statusMsg, "error");
				//alert("Error Message: " + e.message);
			} 
		}
	 }
		 else
		 {
			 swal("", e.Message, "error");
			 $("#btSubmitFeedback").removeAttr("disabled");	
			 $.unblockUI();	
		 }
	 
	 return;
}

function win2(d) {
	 var xml = d.response.replace('<CAVGlobalResponse xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://cav.diamondbank.com/">', '<CAVGlobalResponse>');	  
	 var status = $(xml).find("Status").text();
	 var statusMsg = $(xml).find("StatusMessage").text();
	 
	 if(status == "true"){
			swal("", "Your feedback has been submitted successfully!", "success");
			//$("#txReference", form).val('');
//			$("#btSubmitFeedback").removeAttr("disabled");	
//			var smallImage = document.getElementById('smallImage2');
//			smallImage.src = "img/no-image.png";
			$.unblockUI();	
			$.mobile.navigate("#jobs");
	 }
	 else
	 {
		 swal("", statusMsg, "error");
		 $("#btSubmitFeedback").removeAttr("disabled");	
		 $.unblockUI();	
		 $.mobile.navigate("#jobs");
//	 	 return;
	 }	 
}

function fail(e) {
	$("#btSubmitFeedback").removeAttr("disabled");
	swal("","An error has occurred: Code = " + e.message, "error");
    $.unblockUI();
	return;
}

$(document).delegate("#btGetImage", "click", function () {   
	try 
    {
		navigator.camera.getPicture(onPhotoURISuccess, onFail, { 
		quality: 50,
		destinationType: navigator.camera.DestinationType.FILE_URI,
		sourceType:navigator.camera.PictureSourceType.PHOTOLIBRARY});
	}
	catch(e) {
    	swal("", "An error occurred- " + e.message, "error");
		//alert("Error Message: " + e.message);
    	//alert("Error Name: " + e.name);
	}
});

$(document).delegate("#smallImage1", "click", function () {   
	try 
    {
		navigator.camera.getPicture(onPhotoURISuccess, onFail, { 
		quality: 50,
		destinationType: navigator.camera.DestinationType.FILE_URI,
		sourceType:navigator.camera.PictureSourceType.PHOTOLIBRARY});
	}
	catch(e) {
    	//alert("Error Message: " + e.message);
    	//alert("Error Name: " + e.name);
		swal("", "An error occurred- " + e.message, "error");
	}
});

	// Called when a photo is successfully retrieved
	function onPhotoURISuccess(imageURI) {
	
		// Show the selected image
		var smallImage = document.getElementById('smallImage1');
		smallImage.style.display = 'block';
		smallImage.src =  imageURI; //"data:image/jpeg;base64," + imageURI;
		imageData = imageURI;
	}	
	
	$(document).delegate("#smallImage2", "click", function () {   
	try 
    {
		navigator.camera.getPicture(onPhotoURISuccess2, onFail, { 
		quality: 50,
		destinationType: navigator.camera.DestinationType.FILE_URI,
		sourceType:navigator.camera.PictureSourceType.PHOTOLIBRARY});
	}
	catch(e) {
    	swal("", "An error occurred- " + e.message, "error");
		//alert("Error Message: " + e.message);
    	//alert("Error Name: " + e.name);
	}
});

	// Called when a photo is successfully retrieved
	function onPhotoURISuccess2(imageURI) {
	
		// Show the selected image
		var smallImage = document.getElementById('smallImage2');
		smallImage.style.display = 'block';
		smallImage.src =  imageURI; //"data:image/jpeg;base64," + imageURI;
		imageData = imageURI;
	}	
	
 $(document).delegate("#smallImage3", "click", function () {   
	try 
    {
		navigator.camera.getPicture(onPhotoURISuccess3, onFail, { 
		quality: 50,
		destinationType: navigator.camera.DestinationType.FILE_URI,
		sourceType:navigator.camera.PictureSourceType.PHOTOLIBRARY});
	}
	catch(e) {
    	swal("", "An error occurred- " + e.message, "error");
		//alert("Error Message: " + e.message);
    	//alert("Error Name: " + e.name);
	}
});

	// Called when a photo is successfully retrieved
	function onPhotoURISuccess3(imageURI) {
	
		// Show the selected image
		var smallImage = document.getElementById('smallImage3');
		smallImage.style.display = 'block';
		smallImage.src =  imageURI; //"data:image/jpeg;base64," + imageURI;
		imageData = imageURI;
	}	
	
	function onFail(message) {
	  console.log('Failed because: ' + message);
	}

	function getLocation() {
		navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true });
	}

// onSuccess Geolocation
function onSuccess(position) {
    //Lat long will be fetched and stored in session variables
    lat = position.coords.latitude;
    lng = position.coords.longitude;
    //alert('Lattitude: ' + lat + ' Longitude: ' + lng);
	
	//$("#lbLatitude").val(lat);
	//$("#lbLongitude").val(lng);
	
	 window.localStorage.setItem("latitude", lat);
     window.localStorage.setItem("longitude",lng);
	 $("#txLat").val(lat);
	 $("#txLong").val(lng);
}


// onError Callback receives a PositionError object
function onError(error) {
    alert('code: ' + error.code + '\n' +
          'message: ' + error.message + '\n');
}

//handles click event of reset password button
$(document).delegate("#btResetPassword", "click", function (e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	
		$("#btResetPassword").attr("disabled","disabled");
	
		if($("#txOldPassword").val() == "")
		{
			swal("","Please enter old/current password!", "error");
			$("#btResetPassword").removeAttr("disabled");
			return;
		}
		
		if($("#txUserID").val() == "")
		{
			swal("","Your user id is required!", "error");
			$("#btResetPassword").removeAttr("disabled");
			return;
		}
		
		if($("#txNewPassword").val() == "")
		{
			swal("","Please enter new password!", "error");
			$("#btResetPassword").removeAttr("disabled");
			return;
		}
		
		if($("#txConfirmPassword").val() == "")
		{
			swal("","Please confirm new password!", "error");
			$("#btResetPassword").removeAttr("disabled");
			return;
		}
		
		if($("#txConfirmPassword").val().toLowerCase() != $("#txNewPassword").val().toLowerCase())
		{
			swal("","Passwords do not match!", "error");
			$("#btResetPassword").removeAttr("disabled");
			return;
		}
		
		$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
		$('.blockUI.blockMsg').center();
	
		$.ajax({
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		url: CAV.Settings.PasswordChangeUrl,
		data: '{"username": "' + $("#txUserID").val() + '", "newPassword": "' + $("#txNewPassword").val() + '", "oldPassword": "' + $("#txOldPassword").val() + '"}',
		success: function(data){
				  if(JSON.stringify(data.d.Status) == "true"){
					  
					  // Create session. 
					  var today = new Date();
					  var expirationDate = new Date();
					  expirationDate.setTime(today.getTime() + CAV.Settings.sessionTimeoutInMSec);
					  
					  CAV.Session.getInstance().set({
						  sessionId: data.d.AgentID, 
						  agentName: data.d.Name,
						  expirationDate: expirationDate,
						  rememberMe:$("#checkbox1").is(":checked")
					  });
					  
					  var form = $("#home");
					  var arr = data.d.Name.split(" ");
					  $("#lblName", form).text("Welcome, " + arr[0]);
					  $("#pCompany", form).text(data.d.Company);
					   
					  $("#btResetPassword").removeAttr("disabled");
					  $("#txUserID").removeAttr("readonly");
					  
					  $("#login_name").val("");
					  $("#login_password").val("");
				
					  $.mobile.navigate("#home");					
					  $.unblockUI();
					  return;
					  
				  }
				  else
				  {
					  $.unblockUI();
					  $("#btResetPassword").removeAttr("disabled");
					  swal("",JSON.stringify(data.d.StatusMessage), "error");
				  }					  
		},
		error: function(e){
			console.log(e.message);
			$("#btResetPassword").removeAttr("disabled");
			$.unblockUI();
			swal("","CAV Mobile encountered a problem and could not process your request. Please try again later.", "error");
		}
	});	
	
});

//handles click event of reset password button
$(document).delegate("#btChangePassword", "click", function (e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	
		$("#btChangePassword").attr("disabled","disabled");
			
		if($("#txResetUserID").val() == "")
		{
			swal("","Your user id is required!", "error");
			$("#btResetPassword").removeAttr("disabled");
			return;
		}
		
		$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
		$('.blockUI.blockMsg').center();
	
		$.ajax({
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		url: CAV.Settings.PasswordResetUrl,
		data: '{"username": "' + $("#txResetUserID").val() + '"}',
		success: function(data){
				  if(JSON.stringify(data.d.Status) == "true"){	
					  swal(JSON.stringify(data.d.StatusMessage), "Your password has been reset and a new password sent to you by email", "success");
					  $("#btChangePassword").removeAttr("disabled");				  						
					  $.unblockUI();				  
					  window.location.href = "index.html";
				  }
				  else
				  {
					  $.unblockUI();
					  $("#btChangePassword").removeAttr("disabled");
					  swal("",JSON.stringify(data.d.StatusMessage), "error");
				  }					  
		},
		error: function(e){
			console.log(e.message);
			$("#btChangePassword").removeAttr("disabled");
			$.unblockUI();
			swal("","CAV Mobile encountered a problem and could not process your request. Please try again later.", "error");
		}
	});	
	
});


$(document).delegate("#report", "pageload", function(){
	$("#reportList").listview.listview('refresh');	
});

$(document).delegate("#report", "pagebeforeshow", function(){
	$("#reportList").empty();
});

//populates the report grid
$(document).delegate("#report", "pageshow", function(){
	var isActive = CheckSessionActive();
	if(isActive == false)
	{
		window.location.href = "index.html";
		return;
	}
	
	var session = CAV.Session.getInstance().get();
	var dt = '{"agentID": "' + session.sessionId + '"}';
	
	$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
	$('.blockUI.blockMsg').center();
	
	$.ajax({
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		url: CAV.Settings.ReportUrl,
		data: dt,
		success: function(resp){
			if(JSON.stringify(resp.d.Status) == "true"){
				var html = '';
				$.each(resp.d.JobList, function(index, item){
					html += '<li><a href="#details?id=' + item.TrxnReference + '" data-ajax="false">' + item.TrxnReference + ', ' + item.CustomerName + ' (Submitted ' + item.DateSubmitted+ ') ' + '</a></li>';
				});				
				
				$("#reportList").append($(html));
				$("#reportList").trigger('create');				
				$("#reportList").listview('refresh');						
				$("#reportList").quickPagination({pagerLocation:"bottom",pageSize:"15"});
				
				$.unblockUI();
				return;
			}
			else
			{
				$.unblockUI();
				swal("", JSON.stringify(resp.d.StatusMessage), "error");
				//alert(JSON.stringify(resp.d.StatusMessage));
				return;
			}			
		},
		error: function(e){
		$.unblockUI();
		history.back();  
		return;
		}
	});
});

function CheckSessionActive()
{
	var today = new Date();
	var checkDate = new Date();
	checkDate.setTime(today.getTime() + 0);
	var expirationDate = new Date();
	expirationDate.setTime(today.getTime() + CAV.Settings.sessionTimeout);
	 
	if(expirationDate > checkDate)
	{
		return true;
	}
	else
	{
		return false;	
	}
}

$(document).delegate("#home", "pagebeforeshow", function () {
	var isActive = CheckSessionActive();
	if(isActive == false)
	{
		window.location.href = "index.html";
		return;
	}
});


//initializes the report-details page
$(document).delegate("#details", "pagebeforeshow", function(){
	
	var isActive = CheckSessionActive();
	if(isActive == false)
	{
		CAV.Session.getInstance().set({
		  sessionId: "", 
		  agentName: "",
		  expirationDate: ""
		});
		window.location.href = "index.html";
		return;
	}

	var form = $("#details");					  
	$("#txRptReference", form).val('')
	$("#txRptCustType", form).val('');
	$("#txRptCustName", form).val('');
	$("#txRptProcessedStage", form).val('');
	$("#txRptCustAddress", form).val('');
	$("#txRptStatus", form).val('');
	$("#txRptLandmark", form).val('');
	$("#txRptVisitationDate", form).val('');
	$("#txRptDescription", form).val('');
	$("#txRptAnswer", form).val('');
	$("#txRptReasons", form).val('');
	$("#txRptPersonMet", form).val('');
	$("#txRptPersonMetComments", form).val('');
	$("#txRptFurther", form).val('');
	$("#txAgentName", form).val('');
	
});

$(document).delegate("#details", "pageshow", function(){
	
	$.blockUI({ message: '<img src="images/db.gif"  style="width: 50px; height:50px;" alt="Loading, please wait" />' });
	$('.blockUI.blockMsg').center();
	
	//populate form fields
	var query = $.mobile.urlHistory.getActive().url.split("?")[1];
	query = query.replace("id=","");
		
	$.ajax({
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		url: CAV.Settings.ReportDetailUrl,
		data: '{"reference": "' + query + '"}',
		success: function(data){
				  if(JSON.stringify(data.d.Status) == "true"){
					  var form = $("#details");	
					  $("#txRptReference", form).val(query)
					  $("#txRptCustName", form).val(data.d.Job.CustomerName);
					  $("#txRptCustAddress", form).val(data.d.Job.CustomerAddress);
					  $("#txRptCustType", form).val(data.d.Job.CustomerType);					  
					  
					  $("#txRptProcessedStage", form).val(data.d.Job.ProcessedStage);
					  $("#txRptStatus", form).val(data.d.Job.SureOfAddress);
					  $("#txRptLandmark", form).val(data.d.Job.NearestBusstop);
					  $("#txRptVisitationDate", form).val(data.d.Job.VisitationDate);
					  $("#txRptDescription", form).val(data.d.Job.AddressDescription);
					  $("#txRptAnswer", form).val(data.d.Job.CustomerType);
					  $("#txRptReasons", form).val(data.d.Job.Reasons);
					  $("#txRptFurther", form).val(data.d.Job.Comments);
					  
					  var session = CAV.Session.getInstance().get();
					  $("#txRptAgentName").val(session.agentName);
					  
					  if(data.d.Job.CustomerType != "Corporate"){
						  $("#dvRptPerson1").hide();
						  $("#dvRptPerson2").hide();
					  }else{						  
							$("#dvRptPerson1").show();
							$("#dvRptPerson2").show();
							
							$("#txRptPersonMet", form).val(data.d.Job.StaffMet);
							$("#txRptPersonMetComments", form).val(data.d.Job.StaffMetComments);	
					  }
					  
					  $.unblockUI();
					  return;
				  }
				  else
				  {
					  $.unblockUI();
					  swal("",JSON.stringify(data.d.StatusMessage), "error");
					  history.back(); 
					  return;
				  }					  
		},
		error: function(e){
			console.log(e.message);
			$.unblockUI();
			swal("","CAV Mobile encountered a problem and could not load this page. Please try again later.", "error");
			history.back(); 
		}
	});	
});