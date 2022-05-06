import {clearContentBody, provokeLogin} from "./utils.js"

export function createDOM(){
	let content=document.getElementById("content");
	let footer=document.getElementById("footer");

	clearContentBody()

	let container=document.createElement("div")
    provokeLogin(container, "Please Log In with your NEAR Wallet To Mint a Token");
    container.append(mintDOM())

	content.insertBefore(container, footer)
}

function mintDOM(){
	let mint=document.createElement("div");
	mint.id='mintDOM'
	mint.classList.add("page_style")

	mint.innerHTML=`<h1>Mint A Token!</h1>
					<form id="mint-form">
						<input id="mint-title" type="text" placeholder="Title">
                      	<input id="mint-description" type="text" placeholder="Description">
                      	<input id="mint-media" type="text" placeholder="Enter a valid media link">
					</form>
					<button id="mint-submit">Submit!</button>`

	let button=mint.querySelector('button')
	button.addEventListener('click',mintListener)

	return mint
}

async function mintListener(){
	if(!window.walletConnection.isSignedIn()){
		alert('Please Sign In!')
		return;
	}

	const title=document.getElementById("mint-title").value;
	const description=document.getElementById("mint-description").value;
	const media=document.getElementById("mint-media").value;

	if (!title || !description || !media){
		alert("Please fill the required inputs!");
		button.disabled = false
		return;
	}


	let d=new Date()
	const tokenId= "token"+d.getTime()
	
	try {
		await window.nft_contract.nft_mint({"token_id": tokenId, 
		                                "metadata": {"title": title, "description": description, "media": media}, 
		                                "receiver_id": window.accountId},
		                              "300000000000000",
		                              "100000000000000000000000");
	} 
	catch (e) {
		alert(
		  'Something went wrong! ' +
		  'Maybe you need to sign out and back in? ' +
		  'Check your browser console for more info.'
		)
		throw e
	}
}