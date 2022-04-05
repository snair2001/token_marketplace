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

function tokenModalOpen(e){
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
		                	<div class='token_main_text'>List on Marketplace</div>
		                	<input id="token_sale_price" type="number" placeholder="Sale Price">
		                	<button id="submit_for_sale"> Submit </button>
		                </div>
		                <button id="close_modal">Close</button>
	                </div>`

	if (e.target.token.approved_account_ids["auction_market.evin.testnet"]!=undefined){ //Change address here, or fix
		modal.querySelector("#approval_section").style.display="none"
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

		const sale_conditions=(sale_price*NEAR_IN_YOCTO).toLocaleString('fullwide', {useGrouping:false});

		try {
			await window.nft_contract.nft_approve({"token_id": tokenId,
			                                "account_id":"auction_market.evin.testnet",   //Using the contract name explicitly
			                                "msg":JSON.stringify({sale_conditions})},
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