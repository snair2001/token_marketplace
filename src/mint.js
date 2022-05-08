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
						<input id="mint-title" type="text" placeholder="Title" required>
                      	<input id="mint-description" type="text" placeholder="Description" required>
                      	<input id="mint-media" type="text" placeholder="Enter a valid media link" required>
                      	<div id='royalty-title'>
                      		<div>Mention royalties:</div>
                      		<button id="add-royalty">+</button>
                      	</div>
                      	<div id="royalty-container"></div>
                      	<button type="submit" id="mint-submit">Submit!</button>
					</form>`

	let royalty_container = mint.querySelector('#royalty-container')
	let add_royalty_button = mint.querySelector('#add-royalty');
	let fields_array = [];
	add_royalty_button.addEventListener('click', ()=>{ add_royalty(royalty_container, fields_array)} )

	let form=mint.querySelector('#mint-form')
	form.addEventListener('submit',(e)=>{
		e.preventDefault();
		mintListener(fields_array);
	})

	return mint
}

function add_royalty(container, array){
	let field = document.createElement('div');
	field.id = 'royalty-field'
	field.innerHTML = 
		`<input id="royalty-account" type="text" placeholder="Account Id" required>
		<input id="royalty-percentage" type="number" placeholder="Share Percentage (5,10,20)" min="1" max="100" required>
		<button id='remove-royalty'>x</button>`

	let object = {
		account : field.querySelector('#royalty-account'),
		percentage : field.querySelector('#royalty-percentage')
	}
	array.push(object);
	
	let remove_button = field.querySelector('button');
	remove_button.object = object;
	remove_button.addEventListener("click", (e) => {
		e.preventDefault()
		removeField(e, array)
	});

	container.append(field);
}

function removeField(e, array){

	let object = e.target.object;
	let index = array.indexOf(object);
	if(index > -1){
		array.splice(index, 1);
	}

	let field = e.target.parentNode;
	field.remove();
}

async function mintListener(array){
	if(!window.walletConnection.isSignedIn()){
		alert('Please Sign In!')
		return;
	}

	// The proper array with just name and percentage
	array = array.map(object => ({
		account : object["account"].value,
		percentage : parseInt(object["percentage"].value) * 100
	}));

	if (!validateRoyalties(array)){
		return;
	}

	let royalties_final = {};

	for (let i=0; i<array.length; i++){
		royalties_final[ array[i].account ] = array[i].percentage
	}

	const title=document.getElementById("mint-title").value;
	const description=document.getElementById("mint-description").value;
	const media=document.getElementById("mint-media").value;


	let d=new Date()
	const tokenId= "token"+d.getTime()
	
	try {
		await window.nft_contract.nft_mint({"token_id": tokenId, 
		                                "metadata": {"title": title, "description": description, "media": media}, 
		                                "receiver_id": window.accountId,
		                            	"perpetual_royalties": royalties_final},
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

function validateRoyalties(array) {
	if (array.length > 6){
		alert("No more than 6 royalty accounts.");
		return false;
	}

	let royalty_sum = array.reduce((previous, current)=> previous + current.percentage, 0)

	if(royalty_sum > 5000){
		alert("Cannot have royalty more than 50%");
		return false
	}
	
	return true
}