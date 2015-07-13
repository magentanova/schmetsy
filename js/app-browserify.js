// es5 polyfills, powered by es5-shim
require("es5-shim")

// es6 polyfills, powered by babel
require("babel/polyfill")

var Promise = require('es6-promise').Promise

var api_key = "33fu73tde0kmtk2yiqnnndur",
	shared_secret = "qfldqskp7b",
	leftArrowCode = '&#8249',
	rightArrowCode = '&#8250'


var $ = require('jquery')

var Backbone = require('Backbone')

console.log('loaded')

window.$ = $

'https://openapi.etsy.com/v2/listings/active?api_key=33fu73tde0kmtk2yiqnnndur'
'https://openapi.etsy.com/v2/listings/active.js?includes=Images&api_key=33fu73tde0kmtk2yiqnnndur&callback=?'

'https://openapi.etsy.com/v2/users/35960347&api_key=33fu73tde0kmtk2yiqnnndur'


function processShopCollection(model){
	var shopId = model.attributes.Shop.shop_id,
		url = `https://openapi.etsy.com/v2/shops/${shopId}/listings/active.js?includes=Images&callback=?&api_key=${api_key}`,
		lc = new ListingCollection(),
		lv = new ShopView({collection:lc})
	lc.url = url
	lc.targetModel = model
	lc.fetch()
}

function detailTemplate(listing){
	var descr = listing.attributes.description.split(' ').slice(0,25).join(' ') + '...'
	var html = 
		`<div class="detail-view">
			<h1>${listing.attributes.title}</h1>
			<a class="nav-arrow left">${leftArrowCode}</a><img src=${listing.attributes.Images[0].url_fullxfull}><a class="nav-arrow right">${rightArrowCode}</a>
			<p class="viewsNfaves tag"><span>Views: ${listing.attributes.views}</span><span>Faves: ${listing.attributes.num_favorers}</span></p>
			<p class="description tag">${descr}</p>
			<p class="price tag">&#36;${listing.attributes.price}</p>
		</div>
		`
	return html
}

function collectionRow(lc){
	var html = lc.models.map(function(model,i){
		if (i == lc.targetIndex) return `<a href="#details/${model.attributes.listing_id}"><img class="target" src="${model.attributes.Images[0].url_75x75}"></a>`
		return `<a href="#details/${model.attributes.listing_id}"><img src="${model.attributes.Images[0].url_75x75}"></a>`
	}).join('')
	return html
}

function gridTemplate(models){
	var html = '<div class="thumb-grid"><a href="#test"> test</a>'
	html += models.map(function(model){return thumbTemplate(model.attributes)}).join('')
	html += '</div>'
	return html
}

function inputTemplate(){
	return 	`
		<div class="inputs">
			<div id="threePics">
				<input name="threePics" func="filterForPics" type="checkbox">
				<label for="threePics">has at least 3 photos</label>
			</div>
			<input type="text" placeholder="browse for tchotchkes by keyword">
			<div id="lastWeek">
			    <input name="lastWeek" func="filterForRecency" type="checkbox">
				<label for="lastWeek">came out within the last week</label>
		    </div>
		    <div id="onSale">
				<input func="filterForSale" name="onSale" type="checkbox">
				<label for="onSale">on sale</label>
			</div>
		</div>`
}

function thumbTemplate(listing){
	var html = `<a href="#details/${listing.listing_id}"><div class="thumb"><img src=${listing.Images[0].url_170x135}></div></a>`
	return html
}

var ListingModel = Backbone.Model.extend({

	parse: function(response){
		if (response.results) return response.results[0]
		else return response
	}
})

var ListingCollection = Backbone.Collection.extend({

	limit: 25,

	api_key: '33fu73tde0kmtk2yiqnnndur',

	model:ListingModel,

	targetIndex: null,

	url: function(){
		return `https://openapi.etsy.com/v2/listings/active.js?includes=Images&Shop&limit=${this.limit}&api_key=${this.api_key}&callback=?`
	},

	arrange: function(){
		console.log('arranging')
		var targetModelIndex = this.getModelIndex(this.targetModel)
		if (targetModelIndex == -1){
		// if the model wasn't in our models (like if we only were able to pull a sample from the collection)
		// then push the model onto the end and set target index to the last index
			this.models.push(model)
			targetModelIndex = this.models.length - 1 
		}
		// splice out the target model from the array
		var targetModel = this.models.splice(targetModelIndex,1)[0] //indexed because output is an array
		// insert that spliced out model into the middle of the array. 
		//  and set targetIndex as collection attribute
		var middleIndex = Math.floor(this.models.length/2)
		this.models.splice(middleIndex,0,targetModel)
		this.targetIndex = middleIndex
		console.log(this.targetIndex)
	},

	getModelIndex: function(model) {
	var Ids = this.models.map(function(model){
		return model.attributes.listing_id
		})
	return Ids.indexOf(model.attributes.listing_id) 
	},

	parse: function(data){
		console.log("fetched. parsing now.")
		return data.results
	}
})

var DetailView = Backbone.View.extend({
	el: document.querySelector('.container'),

	initialize: function(){
		this.model.on("request", function() {
			console.log('arent we fetching')
			this.$el.html("<img src='img/spinner.gif'>")
		}, this)
		this.listenTo(this.model, 'sync change forceUpdate', this.render)
	},

	render: function(){
		console.log('rendering detail view...')
		this.$el.html(detailTemplate(this.model))
	}
})

var GridView = Backbone.View.extend({
	el: document.querySelector('.container'),

	displayLimit: 25,

	events: {
		'keyup input': 'collectionSearch',
		'click input[type="checkbox"]': 'filterResults'
	},

	filters: [],

	firstRender: true,

	initialize: function(){
		this.collection.on("request", function() {
			console.log('arent we fetching')
			this.$el.html('<div class="thumb-grid"><img src="img/spinner.gif"></div')
		}, this)
		this.listenTo(this.collection, 'sync change', this.render)
	},

	collectionSearch: function(e){
		if (e.keyCode == 13){
			window.e = e
			var keywordString = e.target.value
			location.href += "#search/" + keywordString	
		}		
	},

	filterForPics: function(model){
		if (model.attributes.Images && model.attributes.Images.length > 2) return true
		return false
	},

	filterForRecency: function(model){
		var creationMilliseconds = model.attributes.original_creation_tsz * 1000
		var nowMilliseconds = new Date().getTime()
		var secondsInWeek = 604800
		if (nowMilliseconds - creationMilliseconds > secondsInWeek) return false
		return true
	},

	filterResults: function(e){
		var checkbox = e.target
		if (!(checkbox.checked)) { //if we just UNchecked it, remove this filter from the list
			var index = this.filters.indexOf(checkbox.getAttribute('func'))
			this.filters.splice(index,1)
			this.collection.trigger('change')
			return
		}
		// otherwise, push the filter onto the list
		window.checkbox = checkbox
		this.filters.push(checkbox.getAttribute('func'))
		console.log(this.filters)
		this.collection.trigger('change')
	},

	render: function(){
		console.log('rendering grid...')
		var models = this.collection.models
		for (var i=0;i<this.filters.length;i++){ //use each checked filter on models
			var func = this.filters[i]
			window.thisView = this
			models = models.filter(this[func])
		}

		models = models.slice(0,this.displayLimit) //limit number of listings shown
		
		if (this.firstRender){
			this.firstRender = false
			this.$el.html(inputTemplate() + gridTemplate(models))
		}

		else this.$el.find('.thumb-grid').html(gridTemplate(models))

	}
})

var ShopView = Backbone.View.extend({

	el: document.querySelector('body'),

	events: {
		'click a.left': 'shiftLeft',
		'click a.right': 'shiftRight'
	},

	// yes, the following two should definitely be one function
	shiftLeft: function(){
		var index = this.collection.targetIndex	
		var detailView = this.collection.targetModel.view
		this.collection.targetModel = this.collection.models[index-1] //shift target model one to the left
		detailView.model = this.collection.targetModel //sync up detail view with focus
		// listing/model
		detailView.model.view = detailView //point the reference back, we'll need it
		this.collection.targetIndex -= 1
		// pop the last off and put it in front so the focused item stays centered
		var last = this.collection.models.pop()
		this.collection.models.splice(0,0,last) 
		this.collection.trigger('change') //rerender bottom row
		detailView.render()
	},

	shiftRight: function(){
		var index = this.collection.targetIndex	
		var detailView = this.collection.targetModel.view
		this.collection.targetModel = this.collection.models[index+1] //shift target model one to the left
		detailView.model = this.collection.targetModel //sync up detail view with focus
		// listing/model
		detailView.model.view = detailView //point the reference back, we'll need it
		this.collection.targetIndex += 1
		var first = this.collection.models.splice(0,1)[0]
		this.collection.models.splice(this.collection.models.length-1,0,first) // pop the first off and put it in on the end 
		// so the focused item stays centered
		this.collection.trigger('change') //rerender bottom row	
		console.log(detailView.model)
		detailView.model.trigger('forceUpdate') //this doens't work -- why???
		// detailView.render()
	},

	initialize: function(){
		this.listenTo(this.collection, 'sync change', this.render)
	},

	render: function(){
		var row = this.$el.find('.bottom-row')
		console.log('rendering shop thumbs...') 
		this.collection.arrange()
		row.html(collectionRow(this.collection))
	}
})

var SchmetsyRouter = Backbone.Router.extend({

	routes: {
		'details/:listingId': 'showDetails',
		'search/:keywordString': 'showSearchResults',
		'prop':'test',
		'*path': 'home'
	},

	initialize: function(){
		this.lc = new ListingCollection
	},

	home: function(){
		console.log('routing home')
		var lc = new ListingCollection()
		var gv = new GridView({collection:lc})
		lc.fetch()
		console.log('just fetched')
	},

	showDetails: function(listingId){
		var url = `https://openapi.etsy.com/v2/listings/${listingId}.js?includes=Images,Shop&api_key=33fu73tde0kmtk2yiqnnndur&callback=?`
		var lm = new ListingModel()	
		lm.url = url
		console.log(lm)
		var dv = new DetailView({model:lm,collection:this.lc})
		lm.view = dv
		lm.fetch().then(function(){
			processShopCollection(lm)
		})
	},

	showSearchResults: function(keywordString){
		var lc = new ListingCollection()
		var gv = new GridView({collection:lc})
		lc.fetch({
			data: { keywords: keywordString},
			processData: true,
		})
	}
})


var router = new SchmetsyRouter()

Backbone.history.start()


// just Node?
// var fetch = require('node-fetch')
// Browserify?
// require('whatwg-fetch') //--> not a typo, don't store as a var

// other stuff that we don't really use in our own code
// var Pace = require("../bower_components/pace/pace.js")

// require your own libraries, too!
// var Router = require('./app.js')

// window.addEventListener('load', app)

// function app() {
    // start app
    // new Router()
// }

