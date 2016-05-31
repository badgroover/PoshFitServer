var updateTotalPointsFor = function(selection) {
	var row = selection.parent().parent(),
		userDuration = $(row).find("#user-duration").val(),
		activityDuration = $(row).find("[data-activity-duration]").data("activity-duration"),
		activityPointsPerDuration = $(row).find("[data-activity-points]").data("activity-points");
	if(userDuration || activityDuration == 0) {
		var totalPoints;
		if(activityDuration == 0){
			$(row).find("#user-duration").val("0");
			totalPoints = activityPointsPerDuration;	
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

	var selectedActivityIds = [];

	// keep track of the selections on page load in case it is delselected later (will need to be deleted)

	$("table #activities #user-selected:checked").each(function(){
		var row = $(this).parent().parent(),
			activityId = $(row).find("#activity").data("activity-id");
		selectedActivityIds.push(activityId);
	});

	console.log(selectedActivityIds);

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

	$("table #activities #user-duration").on('change textInput input', function(){ 
		checkbox = $(this).parent().parent().find("#user-selected:checked");
		if(checkbox.length > 0) {
			updateTotalPointsFor(checkbox);
		}
 	});

 	// add the date stamp before form submit

 $("#activity-form").submit( function(eventObj) {
 		
      // Get current time and check it against the time with which the page was loaded.
      var today = new Date(),
      	  yesterday = new Date(),
      	  yesterdaysDate,
      	  submissionDate,
      	  currentDate = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate(),
      	  form = $("#activity-form"),
      	  allValuesEntered = false,
      	  totalPointsForPhysical=0;

      yesterday.setDate(yesterday.getDate() - 1);
      yesterdaysDate = yesterday.getFullYear() + "-" + (yesterday.getMonth() + 1) + "-" + yesterday.getDate();

      if((activityDate === currentDate || activityDate === yesterdaysDate) && activityDate.toTime() > startDate.getTime()) {
      	if(activityDate == currentDate){
      		submissionDate = currentDate;
      	} else {
      		submissionDate = yesterdaysDate
      	}

	// check if all selected values have duration and points calculated
	$("table #activities #user-selected:checked").each(function(){
		var row = $(this).parent().parent(),
			activityTotalPoints = $(row).find("#total-points").val(),
			activity = $(row).find("#activity").text(),
			category = $(row).find("#category").data("category");
		
		if(activityTotalPoints && activityTotalPoints > 0){
			if(category === "Physical") {
				totalPointsForPhysical += parseInt(activityTotalPoints);
			}
		}

		if(activityTotalPoints && activityTotalPoints > 0){
			allValuesEntered = true;
		} else {
			allValuesEntered = false;
			alert("Please enter a duration for " + activity);
			eventObj.preventDefault();
			return false;
		}
	});
	
	if(totalPointsForPhysical > 10) {
		alert("Physical Activity points > 10!");	
		return false;
	}

	if(allValuesEntered) {
		var formValue = {};
		$.each($(form).serializeArray(), function(i, field) {
			if(field.name === "activitySelected") {
				if(formValue[field.name]) {
					formValue[field.name].push(field.value);		
				} else {
					formValue[field.name] = [];
					formValue[field.name].push(field.value);
				}	
			}
		});

		// check if any selected activities are unselected 
    		$.each(selectedActivityIds, function( index, value ) {
  			if($.inArray(value.toString(), formValue["activitySelected"]) == -1){
				$(form).append('<input name="activityIdDeleted" value="'+ value +'" /> ');	
  			}
		});
  	
  		$(this).append('<input type="hidden" name="activityDate" value="'+ submissionDate +'" /> ');	
  		return true;
	}
      } else {
      	if(activityDate.getTime() < startDate.getTime()){
      		alert("The challenge has not started yet. Patience!");
      	} else {
      		alert("Too late to submit data for " + activityDate + " !");
      	}
      	window.location.replace("/dashboard");
      	return false;
      }
      
  	});

});
