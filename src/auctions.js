import {clearContentBody, provokeLogin} from "./utils.js"

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
		// let sales=await window.marketplace_contract.get_auctions({})
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