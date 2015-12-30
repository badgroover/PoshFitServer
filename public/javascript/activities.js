$(document).ready(function(){
	$("table #activities input:checked").each(function(){
		// enable duration text box 
		// calculate total points for duration entered (if entered or if duration is 0)
		var row = $(this).parent().parent(),
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
			$(row).find("#total-points").val(totalPoints);
		}
	});
});