var CAV = CAV || {};

CAV.SignInController = function () {
    this.$signInPage = null;
    this.$btnSubmit = null;
	this.$chkRememberMe = null;
	this.$username = null;
};

CAV.SignInController.prototype.init = function () {
    this.$signInPage = $("#page-login");
    this.$btnSubmit = $("#btLogin", this.$signInPage);
	this.$chkRememberMe = $("#checkbox1", this.$signInPage);
	this.$username = $("#login_name", this.$signInPage);
};

function ValidateEmail(email) {
        var expr = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
        return expr.test(email);
}; 

CAV.SignInController.prototype.onSignInCommand = function () {
	e.preventDefault();
	e.stopImmediatePropagation();
	this.$btnSubmit.attr("disabled","disabled");
		
	    if($("#login_name").val() == "")
		{
			swal("","Your user name is required!", "error");
			this.$btnSubmit.removeAttr("disabled");
			return;
		}
		
		if($("#login_password").val() == "")
		{
			swal("","Your password is required!", "error");
			this.$btnSubmit.removeAttr("disabled");
			return;
		}
		
		var email = $("#login_name").val();
		var expr = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
		if(!expr.test(email)){
			swal("","Please enter a valid user id.", "error");
			this.$btnSubmit.removeAttr("disabled");
			return;
		}
				   
	$.blockUI({ message: '<img src="images/db.gif"  style="width: 60px; height:60px;" />' });
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
				  expirationDate.setTime(today.getTime() + CAV.Settings.sessionTimeoutInMSec);
				  
				  CAV.Session.getInstance().set({
					  sessionId: data.d.AgentID, 
					  agentName: data.d.Name,
					  expirationDate: expirationDate,
					  rememberMe:$("#checkbox1").is(":checked")
				  });
				  
				  if(JSON.stringify(data.d.FirstLogin) == "true"){					
				  	  $.unblockUI();
				      $("#txUserID").val($("#login_name").val());
					  $("#txUserID").attr("readonly","readonly");
					  //$.mobile.navigate("www/screens.html#password-change");
					  //$.mobile.changePage( "www/screens.html#password-change", { transition: "slideup"} );
					   window.location.href ="www/screens.html#password-change";
					  return;
				  }
				  
				  var form = $("#home");
				  var arr = data.d.Name.split(" ");
				  $("#lblName", form).text("Welcome, " + arr[0]);
				  $("#pCompany", form).text(data.d.Company);
				   
				   $("#btLogin").removeAttr("disabled");
				   $("#login_name").val("");
				   $("#login_password").val("");
			
				  //$.mobile.changePage( "www/screens.html#home", { transition: "slideup"} );				
				   window.location.href ="www/screens.html#home";
				  $.unblockUI();
				  return;
			  } else {			
				  $("#btLogin").removeAttr("disabled");
				  swal("",JSON.stringify(data.d.StatusMessage), "error");	  
	         	  $.unblockUI();
			  }
		  },
		  error: function (e) {
			   this.$btnSubmit.removeAttr("disabled");
			  console.log(e.message);
			  swal("","CAV Mobile encountered a problem and could not log you in you. Please try again later.", "error");
			   $.unblockUI();
		  }
	  });
};