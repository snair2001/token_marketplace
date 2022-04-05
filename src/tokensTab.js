import {clearContentBody, provokeLogin} from "./utils.js"

const GAS_FEE= `100000000000000`
const NEAR_IN_YOCTO=1000000000000000000000000;

export async function createDOM(){
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()

	let container=document.createElement("div")
	container.id="tokens_tab"
	container.innerHTML=`<h1>Tokens</h1>`
    container.append(await tokensDOM())

	content.insertBefore(container, footer)
}

async function tokensDOM(){
	let container=document.createElement('div');
	container.id="items"
	//Shows a maximum of 15 tokens. Note this
	let result= await window.nft_contract.nft_tokens_for_owner({account_id:window.accountId, limit:20});

	for (let i=0; i<result.length; i++)
		container.append(tokenFromObject(result[i]));

	return container
}

function tokenFromObject(tokenObject){
	let token=document.createElement('div')

	token.innerHTML=`<img class='cursor' src=${tokenObject.metadata.media} height='200px' class='item_image'>
					<div class='item_owner'>${tokenObject.metadata.title}</div>`

	let img=token.querySelector("img")
	
	img.token=tokenObject
	img.addEventListener('click', tokenModalOpen)

	return token;
}

async function tokenModalOpen(e){
	let {container,modal}= createModal("token_info");
	let body=document.body;
	body.append(container);
	body.classList.add('modal-open');

	let media=e.target.token.metadata.media
	let title=e.target.token.metadata.title
	let description=e.target.token.metadata.description
	let tokenId=e.target.token.token_id

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
		                <div id="approval_section">
		                	<div class='token_main_text'>List as sale</div>
		                	<input id="token_sale_price" type="number" placeholder="Sale Price">
		                	<button id="submit_for_sale"> Submit </button>
		                </div>
		                <div id="auction_section">
		                	<div class='token_main_text'>List as auction</div>
		                	<form id='auction_form'>
			                	<input id="token_auction_price" type="number" placeholder="Starting Price" step=0.01 required><br>
			                	<label class="token_subtext">Start Time:</label>
			                	<input id="token_auction_start_time" type="datetime-local" required><br>
			                	<label class="token_subtext">End Time:</label>
								<input id="token_auction_end_time" type="datetime-local" required>
								<button id="submit_for_auction" type="submit">Submit</button>
							</form>
						</div>
		                <button id="close_modal">Close</button>
	                </div>`

	/*
	if (e.target.token.approved_account_ids["auction_market.evin.testnet"]!=undefined){ //Change address here, or fix
		modal.querySelector("#approval_section").style.display="none"
		modal.querySelector("#auction_section").style.display="none"
	}
	*/

	if (await hasOwnerListed(e.target.token)){
		console.log('yes')
		modal.querySelector("#approval_section").style.display="none";
		modal.querySelector("#auction_section").style.display="none";
	}
	

	modal.querySelector("#submit_for_sale").addEventListener("click", async(e)=>{

	    const sale_price=parseFloat(document.getElementById("token_sale_price").value);

		if (!sale_price){
			alert("Please fill the fields appropriately.");
			return;
		}

		if(typeof(sale_price)!="number"){
			alert("Sale must be a number")
			return;
		}

		let minimum_balance= await window.marketplace_contract.storage_minimum_balance()
		let current_storage= await window.marketplace_contract.storage_balance_of({"account_id":window.accountId})
		let totalSales=await window.marketplace_contract.get_supply_by_owner_id({"account_id":window.accountId})


		if(current_storage-minimum_balance*totalSales<=minimum_balance){
			alert('Not enough storage. Please visit the Storage section to get storage.')
			return;
		}

		const price=(sale_price*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});
		const is_auction=false;

		try {
			await window.nft_contract.nft_approve({"token_id": tokenId,
			                                "account_id":"auction_market.evin.testnet",   //Using the contract name explicitly
			                                "msg":JSON.stringify({price,is_auction})},
			                              GAS_FEE,
			                              (NEAR_IN_YOCTO/10).toLocaleString('fullwide', {useGrouping:false}) ) ;
		} catch (e) {
			alert(
			  'Something went wrong! ' +
			  'Maybe you need to sign out and back in? ' +
			  'Check your browser console for more info.'
			)
			throw e
		}
	})

	let formElement=modal.querySelector("#auction_form")
	formElement.token=e.target.token
	formElement.addEventListener('submit', add_auction);

	modal.querySelector("#close_modal").addEventListener("click", ()=>{
    	body.classList.remove('modal-open')
    	container.remove();
  	})

}

async function add_auction(e){
	e.preventDefault()

	let start_time=document.getElementById('token_auction_start_time').value;
	start_time=(new Date(start_time)).getTime();

	let end_time=document.getElementById('token_auction_end_time').value;
	end_time=(new Date(end_time)).getTime();

	// Validation
	let current_time=(new Date()).getTime();
	let limit = 0; 							//TODO: Add limit between start time and end time
	if(start_time < current_time){
		alert('Start time should be greater than current time')
		return;
	}
	if(end_time < current_time){
		alert('End time should be greater than current time')
		return;	
	}
	if(end_time < start_time + limit){
		alert('End time should be greater than start time')
		return;
	}

	start_time*=10**6
	start_time=start_time.toString()
	end_time*=10**6
	end_time=end_time.toString()

	const sale_price=parseFloat(document.getElementById("token_auction_price").value);
	const price=(sale_price*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});

	const is_auction=true;

	try{
		await window.nft_contract.nft_approve({"token_id": e.target.token.token_id,
			                                "account_id":"auction_market.evin.testnet",   //Using the contract name explicitly
			                                "msg":JSON.stringify({price,is_auction,start_time,end_time})},
			                              GAS_FEE,
			                              (NEAR_IN_YOCTO/10).toLocaleString('fullwide', {useGrouping:false}) );	
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

async function hasOwnerListed(token) {
	try{
		let result= await window.marketplace_contract.get_sales_by_owner_id({"account_id":window.accountId, "limit":1000})

		//For now this search will do, gotta update to binary search if it gets popular with a lot of nfts for an account
		for(let i=0;i<result.length;i++){
			if (result[i].token_id==token.token_id){
				return true;
			}
		}
		return false;
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

function createModal(modalId){
  let container=document.createElement("div");
  container.classList.add('modal_bg')

  let modal=document.createElement("div")
  modal.classList.add("modal");
  modal.id=modalId;

  container.appendChild(modal);
  return {container,modal}
}