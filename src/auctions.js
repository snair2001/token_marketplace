import {clearContentBody, provokeLogin} from "./utils.js"

const NEAR_IN_YOCTO=1000000000000000000000000;

export function createDOM(){
	// Creating container
	let container=document.createElement("div")
	container.innerHTML=`<h1>My Auctions</h1>
						<div id='auction_container'></div>`
	container.id='auctions_tab';
    provokeLogin(container, "Please Log In with your NEAR Wallet To participate in the auction");
	
	// Stuff to do to change body
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()
	content.insertBefore(container, footer)

	// populating
    populateItems()
}

export async function populateItems(){
	let container=document.getElementById('auction_container');
	container.id='items';

	try{
		let all_sales=await window.marketplace_contract.get_sales_by_nft_contract_id({'nft_contract_id':'royalties.evin.testnet','limit':40});
		
		// Only the ones that are auction remain
		let sales=all_sales.filter(sale=>sale["is_auction"])
		let token_ids=sales.map(sale=>sale.token_id);

		let tokens=[];
		for(let i=0;i<token_ids.length;i++){
		  let token=await window.nft_contract.nft_token({'token_id': token_ids[i]})
		  tokens.push(token);
		}

		createSalesDOM(sales, tokens, container)
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

function createSalesDOM(sales, tokens, container){

	if (sales.length==0){
		container.textContent="No auctions found!"
		return;
	}

	for(let i=0;i<sales.length;i+=1){
		container.appendChild(createSaleFromObject(sales[i], tokens[i]))
	}

	return;
}

function createSaleFromObject(sale, token){
	let saleDOM=document.createElement('div')
	saleDOM.id="item_container";

	let current_price=(sale.price/(10**24)).toFixed(1);
	let preface='Starting Price'
	if (sale.bids.length!=0){
		current_price=(sale.bids[0].price/(10**24)).toFixed(1);
		preface='Latest Bid'
	}

	saleDOM.innerHTML=`<img src=${token.metadata.media} height='230px' class='item_image'>
						<div class='item_info'>
							<div class='item_left'>
								<div class='item_owner'>${sale.owner_id}</div>
								<div class='item_bid'>${preface}: ${current_price} NEAR</div>

							</div>
							<div>
								<button id="details">Details</button>
							</div>
						</div>`;

	let button=saleDOM.querySelector('#details');
	button.sale=sale
	button.token=token
	button.addEventListener('click', openModal);

	return saleDOM;
}

function openModal(e){
	let {container,modal}= createModal("token_info");
	let body=document.body;
	body.append(container);
	body.classList.add('modal-open');

	let media=e.target.token.metadata.media
	let title=e.target.token.metadata.title
	let description=e.target.token.metadata.description
	let tokenId=e.target.token.token_id

	let isItNew=(e.target.sale.bids.length==0);

	let current_price= isItNew ? (e.target.sale.price/(10**24)).toFixed(1) : (e.target.sale.bids[0].price/(10**24)).toFixed(1);

	let startTime=(e.target.sale.start_time/(10**6))
	startTime=new Date(startTime);

	let endTime=(e.target.sale.end_time/(10**6))
	endTime=new Date(endTime);


	modal.innerHTML=`<img src=${media} height="200px">
					<div style="display:flex; flex-direction:column; gap:15px">
	                	<div class="token_static_info">
		                	<div class='token_main_text'>Title</div>
		                	<div class='token_subtext'>${title}</div>
		                </div>
		                <div class="token_static_info">
		                	<div class='token_main_text'>Description</div>
		                	<div class='token_subtext'>${description}</div>
		                </div>
		                <div class="token_static_info">
		                	<div class='token_main_text'>Auction Info</div>
		                	<div class='token_subtext'>${isItNew ? 'Owner' : 'Current Bidder'}: ${isItNew ? e.target.sale.owner_id : e.target.sale.bids[0].bidder_id}</div>		                	
		                	<div class='token_subtext'>Current Price: ${current_price}</div>
		                	<div class='token_subtext'>Start time: ${startTime}</div>		                	
		                	<div class='token_subtext'>End time: ${endTime}</div>
		                </div>
		                <div>
		                	<div class='token_main_text'>Bid</div>
		                	<input id="token_bid_price" type="number" placeholder="Enter your bid">
		                	<button id="bid"> Submit </button>
		                </div>
		                <div>		                	
		                	<button id="end"> End Auction </button>
		                </div>
		                <button id="close_modal">Close</button>
	                </div>`

	bidButton=modal.querySelector('#bid');
	bidButton.sale=e.target.sale
	bidButton.token=e.target.token
	bidButton.addEventListener('click', bid);

	endButton=modal.querySelector('#end');
	endButton.sale=e.target.sale;
	endButton.token=e.target.token
	endButton.addEventListener('click', end_auction);

	modal.querySelector("#close_modal").addEventListener("click", ()=>{
    	body.classList.remove('modal-open')
    	container.remove();
  	})

}

function createModal(modalId){
  let container=document.createElement("div");
  container.classList.add('modal_bg')

  let modal=document.createElement("div")
  modal.classList.add("modal");
  modal.id=modalId;

  container.appendChild(modal);
  return {container,modal}
}

async function bid(e){
	if(!window.walletConnection.isSignedIn())
	{	alert('Please Sign In!')
		return;
	}

	if(window.accountId==e.target.sale.owner_id){
		alert('Cant bid on your own token!');
		return;
	}

	let endTime=(e.target.sale.end_time/(10**6))
	let currentTime=(new Date).getTime()

	if(currentTime > endTime){
		alert('Auction has already ended, please end the auction.')
		return;
	}

	let bid_amount=parseFloat(document.getElementById("token_bid_price").value);
	
	if (!bid_amount){
		alert("Please fill the fields appropriately.");
		return;
	}

	if(typeof(bid_amount)!="number"){
		alert("Bid must be a number")
		return;
	}

	bid_amount=(bid_amount*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});

	try{
		await window.marketplace_contract.add_bid({"nft_contract_id":"royalties.evin.testnet", 
		                                          "token_id":e.target.token.token_id},
		                                          "300000000000000",
		                                          bid_amount);
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

async function end_auction(e){

	let endTime=(e.target.sale.end_time/(10**6))
	let currentTime=(new Date).getTime()

	if(currentTime < endTime){
		alert(`Cannot end the auction now, please try again at ${new Date(endTime)}`)
		return;
	}

	try{
		// Ending auction, if there is a bid its transferred otherwise only the sale gets removed.
		// which is why a revoke transaction is also added to remove the approval, this is so that when the
		// auction ends with no bids, the token tab must enable to list it again.
		await window.marketplace_contract.end_auction({"nft_contract_id":"royalties.evin.testnet", 
		                                          "token_id":e.target.token.token_id},
		                                          "300000000000000");
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
