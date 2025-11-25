jQuery(document).ready( function($) {
	// Open all external link in a new tab
	$('a').each(function() {
	   var a = new RegExp('/' + window.location.host + '/');
	   if (!a.test(this.href)) {
		   // This is an external link
			$(this).attr("rel","noopener noreferrer");
			// Remove after your tests 
			console.log($(this));
	   }
	});
});