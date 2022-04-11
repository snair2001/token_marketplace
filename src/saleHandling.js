export async function populateSales(){
	let sales_content=document.getElementById('main_sale_container');

	try{
		let all_sales=await window.marketplace_contract.get_sales_by_nft_contract_id({'nft_contract_id':'royalties.evin.testnet','limit':40});
		
		//Filtered out the ones that are auctions
		let sales= all_sales.filter( sale=>!sale["is_auction"] )
		let token_ids=sales.map(sale=>sale.token_id);

		let tokens=[];
		for(let i=0;i<token_ids.length;i++){
		  let token=await window.nft_contract.nft_token({'token_id': token_ids[i]})
		  tokens.push(token);
		}

		let container=createSalesDOM(sales, tokens);
		sales_content.appendChild(container);

	}
	catch(e){
		alert(
		  'Something went wrong! ' +
		  'Maybe you need to sign out and back in? ' +
		  'Check your browser console for more info.'
		)
	throw e
	}    
}

function createSalesDOM(sales, tokens){
	let container=document.createElement('div')
	container.id="items"

	if (sales.length==0){
		container.textContent="No sales found!"
		return container;
	}

	for(let i=0;i<sales.length;i+=1){
		container.appendChild(createSaleFromObject(sales[i], tokens[i]))
	}

	return container;
}

function createSaleFromObject(sale, token){
	let saleDOM=document.createElement('div')
	saleDOM.id="item_container";

	let price_to_display=(sale.price/(10**24)).toFixed(1);

	saleDOM.innerHTML=`<img src=${token.metadata.media} height='230px' class='item_image'>
						<div class='item_info'>
							<div class='item_left'>
								<div class='item_owner'>${sale.owner_id}</div>
								<div class='item_bid'>Cost: ${price_to_display} NEAR</div>
							</div>
							<button id="buy_sale">Buy!</button>
						</div>`;

	let button=saleDOM.querySelector('button');
	button.token_id=sale.token_id;
	button.owner_id=sale.owner_id;
	button.price=sale.price;
	button.addEventListener('click', buy);

	return saleDOM;
}

async function buy(e){
	if(!window.walletConnection.isSignedIn())
	{	alert('Please Sign In!')
		return;
	}

	if(window.accountId==e.target.owner_id){
		alert('Cant buy your own token!');
		return;
	}
	
	//Fixed the bn.js issue by converting number to string instead of exponential form.
	let price=e.target.price.toLocaleString('fullwide', {useGrouping:false});

	try{
		await window.marketplace_contract.offer({"nft_contract_id":"royalties.evin.testnet", 
		                                          "token_id":e.target.token_id},
		                                          "300000000000000",
		                                          price);
	}
	catch(e){
		alert(
		  'Something went wrong! ' +
		  'Maybe you need to sign out and back in? ' +
		  'Check your browser console for more info.'
		)
	throw e
	}
}