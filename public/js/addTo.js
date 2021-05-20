
function addToCart(proId) {
	$.ajax({
		url: '/addtocart',
		data: {
			product: proId
		},
		method: 'post',

		success: (response) => {
			if(response.cplus) {
				let ccount = $('#cCount').html();
				ccount = parseInt(ccount) + 1;
				$('#cCount').html(ccount);
			}
		}
	})
}

function addToWishlist(proId) {
	$.ajax({
		url: '/addtowishlist',
		data: {
			product: proId
		},
		method: 'post',

		success: (response) => {
			if (response.wplus) {
				let count = $('#wCount').html();
				count = parseInt(count) + 1;
				$('#wCount').html(count);
			} else{
				alert('product already exists!!')

			}
		}
	})
}

