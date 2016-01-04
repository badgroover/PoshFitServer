var updateTotalPoints = function(){
	$("table #activities input:checked").each(function(){
		// enable duration text box 
		// calculate total points for duration entered (if entered or if duration is 0)
		updateTotalPointsFor($(this));
	});
}

var updateTotalPointsFor = function(selection) {
	var row = selection.parent().parent(),
		userDuration = $(row).find("#user-duration").val(),
		activityDuration = $(row).find("[data-activity-duration]").data("activity-duration"),
		activityPointsPerDuration = $(row).find("[data-activity-points]").data("activity-points");
	if(userDuration || activityDuration == 0) {
		var totalPoints;
		if(activityDuration == 0){
			totalPoints = userDuration * activityPointsPerDuration;	
		} else {
			totalPoints = (userDuration * activityPointsPerDuration)/activityDuration;	
		}
		$(row).find("#total-points").val(totalPoints.toFixed(2));
	}	
}

var clearTotalPointsFor = function(selection) {
	var row = selection.parent().parent();
	$(row).find("#user-duration").val("");
	$(row).find("#total-points").val("");
}

$(document).ready(function(){

	// Update points for previously entered actitivites 

	// updateTotalPoints();

	// Update total points when the user selects an activity

	$("table #activities #user-selected").change(function(){
		// Update total points if the checkbox is selected
		// else wipe out the duration and total points field
		if($(this).is(':checked')){
			updateTotalPointsFor($(this));
		} else {
			clearTotalPointsFor($(this));
		}	
	});

	// Update total points if user activity duration is entered and user selects activity

	$("table #activities #user-duration").change(function(){
		checkbox = $(this).parent().parent().find("#user-selected:checked");
		if(checkbox.length > 0) {
			updateTotalPointsFor(checkbox);
		}
 	});

 	// add the date stamp before form submit

 	$("#activity-form").submit( function(eventObj) {
 		
      // Get current time and check it against the time with which the page was loaded.
      var today = new Date(),
      	  currentDate = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

      if(activityDate === currentDate) {
      	$(this).append('<input type="hidden" name="activityDate" value="'+ currentDate +'" /> ');	
      	return true;
      } else {
      	// TODO: Preethi Check that you can update yesterday's data
      	alert("Too late to submit data for " + activityDate + " !");
      	// TODO: Preethi redirect to the dashboard page here 
      	window.location.replace("/activities");
      	return false;
      }
      
  	});

});