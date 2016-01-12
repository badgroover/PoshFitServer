$(document).ready(function(){

	$("#reset-password").submit( function(eventObj) {
		
		// Compare password strings
		var password = $("#reset-password #password").val(),
			reenterPassword = $("#reset-password #re-enter-password").val();

		if(password == "") {
			alert("Please enter a value for password");
			eventObj.preventDefault();
			return false;
		} else if(reenterPassword == "") {
			alert("Please enter a value for the password re-entry");
			eventObj.preventDefault();
			return false;
		} else if(password !== reenterPassword) {
			alert("Please make sure that the password values match");
			eventObj.preventDefault();
			return false;
		} else {
			return true;
		}


	});

});