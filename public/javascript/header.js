$(document).ready(function(){

	var dateToday = new Date(), 
		todaysYear = dateToday.getFullYear(),
		todaysMonth = dateToday.getMonth() + 1,
		todaysDay = dateToday.getDate();

	// Update nav bar query params for timestamp for get activities

	$(".navbar-nav #nav-today").click(function(){
		var href = $(this).attr("href"), 
			today = new Date(), 
			year = today.getFullYear(),
			month = today.getMonth() + 1,
			day = today.getDate();
		
		var utc = today.toISOString();
		var timezone = today.getTimezoneOffset();
		
		$(this).attr("href", href + "?for=" + year + "-" + month  + "-" + day + "&" + "utc=" + utc + "&timezone=" + timezone);
	});

	console.log(challengeStartDate);
	startDate = new Date(challengeStartDate);
	console.log(startDate);
	
// 	if((todaysYear + "-" + todaysMonth  + "-" + todaysDay) === challengeStartDate) {
// 		$(".navbar-nav #nav-yesterday").remove();
// 	}
	
	if(dateToday.getFullYear() == startDate.getFullYear() && dateToday.getMonth() == startDate.getMonth()
	    &&  dateToday.getDate() == startDate.getDate()) {
	    $(".navbar-nav #nav-yesterday").remove();
	}
		

	$(".navbar-nav #nav-yesterday").click(function(){
		var href = $(this).attr("href"), 
			today = new Date(), 
		    yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
		var year = yesterday.getFullYear(),
		    month = yesterday.getMonth() + 1,
                     day = yesterday.getDate();
		var utc = today.toISOString();
		var timezone = today.getTimezoneOffset();
		
		$(this).attr("href", href + "?for=" + year + "-" + month  + "-" + day + "&" + "utc=" + utc + "&timezone=" + timezone + "&yesterday=true");
	});

});
