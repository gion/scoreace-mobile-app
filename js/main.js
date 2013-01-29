;(function(global, $, _, Backbone){
	var app = global.app || {};
	$(document).ready(function(){
		$.extend(app, {

			config : {
				pingInterval : 1000 * 30 * 10
			},


			clickEvent : 'touchstart' in document ? 'touchstart' : 'click',
			util : {
				isIos : navigator.userAgent.match(/(iPhone|iPod|iPad)/i),
				formatDate : function(timeStamp){
					var d = timeStamp ? new Date(timeStamp.toString().length < 13 ? timeStamp * 1000 : timeStamp) : new Date(),
						separator = '.',
						m = d.getMonth() + 1;

					return [d.getDate(), m <= 9 ? '0' + m : m, d.getFullYear()].join(separator);
				}
			},
/*			notify : function(text){
				$.mobile.activePage.find('.error-popup').text(text).popup('open');
				return this;
			},*/
			alert : function(){
				if(navigator.notification  && navigator.notification.alert)
					navigator.notification.alert.apply(navigator.notification, arguments);
				else
					console.log.apply(console, arguments);
				return this;
			},

			validateResponse : function(response){

				if(response.response == app.response.true)
					return true;

				// else
				$.mobile.loading('hide');
				app.alert(response.text);

				if(response.redirect && response.redirect.toLowerCase() == 'login')
            		app.navigate('login',{trigger:true,replace:false});

				return false;	
			},

			request : function(o){//obj = {method, data, success, failure, complete}

				var f = o.fail;
			
				o.fail = function(a, b, c, d){
				//	app.alert('xhr fail ' + a + ' | ' + b + " | " + c);

					if(!app.validateResponse(a === true ? d : b))
						return;

					if(typeof f == 'function')
						f.apply(this, arguments);
				}



				return $.ajax({
					url : app.urls[o.method],
					data : o.data,
					dataType : 'jsonp',
					type : 'POST',
		            crossDomain: true,
		            xhrFields: {
			     		withCredentials: true
				   	}
				})
				.done(function(response){
					
					if(o.method == 'ping')
						{
							if(response.logged != "true")
								{
									$.mobile.loading('hide');
									app
										.killPing()
										.alert('Your session has expired. Please re-login in order to continue.')
				            			.navigate('login',{trigger:true,replace:false});
				            		
				            		return;
				            	}
				        }
					else
						{
							if(response && response.response && response.response == app.response.true)
								o.success(response.data, response);
							else
								o.fail(true, response.text, response.data, response);
						}
				})
				.fail(o.fail)
				.always(o.complete);
			},

			response : {
				'true' : 'OK',
				'false' : 'NOK',
			},

			urls : {
		//		mainPath : 'http://bogdang.users.projects-directory.com/scoreace/demoApi.php'
			/*	login : 'http://bogdang.users.projects-directory.com/scoreace/demoApi.php?method=login',
				getLeagues : 'http://bogdang.users.projects-directory.com/scoreace/demoApi.php?method=getLeagues',
				ranks : 'http://bogdang.users.projects-directory.com/scoreace/demoApi.php?method=ranks',
				getLeagueDetails : 'http://bogdang.users.projects-directory.com/scoreace/demoApi.php?method=getLeagueDetails',
			},*/
				login : 'http://www.scoreace.com/services/auth/login',
				getLeagues : 'http://www.scoreace.com/services/leagues/get-user-leagues',
				ranks : 'http://www.scoreace.com/services/leagues/get-leagues-ranking',
				getLeagueDetails : 'http://www.scoreace.com/services/leagues/get-league-props/lti/',
				getLeagueGames : 'http://www.scoreace.com/services/leagues/get-league-games/lid/<%=id%>/date_diff/<%=date_diff%>/',
				saveGameScore : 'http://www.scoreace.com/services/post/game/',
				saveProp : 'http://www.scoreace.com/services/post/prop/',
				ping : 'http://www.scoreace.com/api/is-logged'
			
			},

			_ping : function(){
				app.request({
					method: 'ping'
				});
				return this;
			},

			initPing : function(){
				app
					.killPing()
					._pingInterval = setInterval(app._ping, app.config.pingInterval);
				return this;
			},

			killPing : function(){
				if(app._pingInterval)
					clearInterval(app._pingInterval);
				return this;
			},

			initRouter : function(){
				app._router = //Backbone.Router.extend(
				{
					routes : {
						//'' : 'login',
						"login" : 'login',
						'home'	: 'home',
						'league-:leagueId' : 'getLeagueDetails',
						'ranks' : 'ranks',
						'league-details' : 'what'
					},
					trigger : true,
					what : function(){
					},
					login : function(){

						if(app.user)
							app.navigate('home');
						else 
							{
								if(arguments[4] && arguments[4].stopPropagation)
									arguments[4].stopPropagation();

								arguments[4].preventDefault();
								app.navigate('login');
								app.killPing();
							}
					},

					home : function(){
						$.mobile.loading('show');

						if(!app.user)
							return app.navigate('login');

						app.pages.home.model.update();
					},

					ranks : function(){

						$.mobile.loading('show');
						app.pages.ranks.model.update();
					},

					getLeagueDetails : function(leagueId){

					//	app.changePage($('#league-details'));
					},


					route : function (page){
						if(!app._router.trigger)
							return function(){};

						return function(){if(app._router[page]) app._router[page].apply(this,arguments);};
					}
				};
				//);

				var route = app._router.route;

				app.router = new $.mobile.Router({
					//"" : route('login'),
					'league-(\d+)' :  {events :'bc', handler : route('getLeagueDetails')},
					"login" : {events :'bc', handler : route('login')},
					'home'	: {events :'bc', handler : route('home')},
					'ranks' : {events :'bc', handler : route('ranks')}
				});


				return this;
			},
			bindEventHandlers : function(){
				 $(document)
		            .on(app.clickEvent, "a:not([data-bypass])", function (evt) {
		                // Get the anchor href and protcol
		                var href = $(this).attr("href");
		                var protocol = this.protocol + "//";

		                // Ensure the protocol is not part of URL, meaning it's relative.
		                if (href && href.slice(0, protocol.length) !== protocol &&
		                    href.indexOf("javascript:") !== 0) {
		                    // Stop the default event to ensure the link will not cause a page
		                    // refresh.
		                    evt.preventDefault();

		                    // `Backbone.history.navigate` is sufficient for all Routers and will
		                    // trigger the correct events. The Router's internal `navigate` method
		                    // calls this anyways.
		                    app.navigate(href);
		                }
		            })

		            // simulate a click on the first listed league
		            .on(app.clickEvent, '#enter_scores', function(e){
		            	e.preventDefault();

		            	// a bit of hardcode magic
		            	$(this)
		            		.parents('.ui-page')
		            		.find('.leagues-wrapper li:first div:first')
		            		.trigger('click');
		            })


		            // prevent jqm from listening to haschange events & stuff
		            .on("mobileinit", function () {
		                $.mobile.ajaxEnabled = false;
		                
		               // $.mobile.hashListeningEnabled = false;
		               // $.mobile.linkBindingEnabled = false; //-- works properly with jqm 1.1.1 rc1
						
		                $.mobile.pushStateEnabled = false;
		               
		                $.mobile.defaultDialogTransition = "none";
		                $.mobile.defaultPageTransition = app.util.isIos ? "fade" : "none";
		                $.mobile.page.prototype.options.degradeInputs.date = true;
		                $.mobile.page.prototype.options.domCache = false;

		                //enable flag to disable rendering
		           //     $.mobile.ignoreContentEnabled=true;
		                // enable loading page+icon
		                $.mobile.loader.prototype.options.text = "loading";
		                $.mobile.loader.prototype.options.textVisible = true;
		                $.mobile.loader.prototype.options.theme = "a";
		                $.mobile.loader.prototype.options.html = "";

		                $.mobile.phonegapNavigationEnabled = true;

		                $.mobile.touchOverflowEnabled = true;


		                $.support.cors = true;
    					$.mobile.allowCrossDomainPages = true;


		            })
					.trigger('mobileinit')

					.on(app.clickEvent, '[data-rel="back"]', function(e){
						e.preventDefault();
						history.back();
					});



		            $('#login_form').on('submit', function(e){
		            	e.stopPropagation();
		            	e.preventDefault();

		            	$.mobile.loading('show');

		            	var credentials = {
		            		email : $('#login_user').val(),
		            		password : $('#login_password').val()
		            	};

		            	app.request({
		            		method : 'login',
		            		data : credentials	,
		            		success : function(data, fullResponse){
		            			app.user = data;
			            		$.mobile.loading('hide');
			            		app.initPing();
			            		app.navigate('home',{trigger:true,replace:false});
		            		},
		            		fail : function(){
		            			// service fail
		            			if(arguments[0] === true)
		            				{
		            					var responseText = arguments[1],
		            						responseData = arguments[2],
		            						fullResponse = arguments[3];

		            					$.mobile.loading('hide');
			            				return app.alert('responseText');
		            				}
		            			// true ajax fail
		            			else
		            				{
		            					app.alert("true ajax fail : " + arguments[0] + ' ' + arguments[1]);
		            				}
		            		},
		            		// something to do after either a success or a failure
		            		complete : function(){}
		            	});

/*		            	$.ajax({
		            		url : app.urls.login,
		            		dataType : 'JSON',
		            		type : 'post',
		            		data : credentials	            		
			            }).done(function(response){
			            	R = response;
			            	if(response.success !== true)
			            		{
		            				$.mobile.loading('hide');
			            			return alert('invalid credentials');
			            		}
		            		app.user = response.result;
		            		$.mobile.loading('hide');
		            		app.navigate('home',{trigger:true,replace:false});
		            	});*/
		            });

				return this;
			},
			changePageOptions : {
				transition : 'slide',
				reverse : false,
				changeHash : false
			},

			changePage : function(page, options){

				return this;

				$.mobile.initializePage(page);
				var o = $.extend(app.changePageOptions, options);
			//	page.trigger("create");
				$.mobile.changePage(page, o, o.reverse, o.changeHash);
			//	page.trigger("pagecreate");
				return this;
			},
			
			navigate : function(page, options){

				page = page.replace(/^#+/,'');

				var o = $.extend(app.navigateOptions, options),
					newLocation = window.location.toString().replace(/#.*$/,'') + '#' + page;

				app._router.trigger = o.trigger;

				$(window).off('hashchange.navigate').on('hashchange.navigate', function(){
					clearTimeout(t)
				});

				if(o.replace)
					// no history changes
					window.location.replace(newLocation);
				else //if(window.location.toString() != newLocation)
					window.location = newLocation;

				if(o.trigger)
					var t = setTimeout(function(){
						$(window).trigger('hashchange');
					}, 100);

				$.mobile.loading('hide');
				return this;
			},

			navigateOptions : {
				replace : false,
				trigger : true
			},

			// hack to allow same page transitions to look good :| 
			getNextLeagueDetailsPage : function(){
				if($.mobile.activePage.attr('id') == 'leagueDetails1')
					return $('#leagueDetails2');
				return $('#leagueDetails1');
			},

			initPages : function(){

				app.pages = {
					home : {

						league : Backbone.Model.extend({
							defaults : {
								score : 0,
								rank : 0,
								template : _.template($('#league-template').html())
							},
							initialize : function(){
								this.view = new app.pages.home.leagueView({model : this});
							}
						}),

						leagueView : Backbone.View.extend({
							tagName : "li",
							className : 'ui-grid-b league league-prop',
							render : function(){
								return this.$el.html(this.model.get('template')(this.model.toJSON()));
							},
							events : {
								'vclick div' : 'selectLeague'
							},
							selectLeague : function(e){
								e.preventDefault();
								e.stopPropagation();
								if($(e.target).parents('#ranks').length > 0)
									return;


								var currentSelected = app.pages.home.model.get('selectedLeague');

								if(!currentSelected || (currentSelected && currentSelected != this.model))
									app.pages.home.model.set('selectedLeague', this.model);
								else
									app.pages.home.model.trigger('change:selectedLeague');
							}
							
						}),

						leagues : Backbone.Collection.extend({


								url : app.urls.getLeagues,

								initialize : function(){
									this.model = app.pages.home.league;
									this.on('reorder', function(){
										app.pages.home.model.view.render();
									}, this);
								},

								parse: function(response) {
									var a = [];
									$.each(response.data, function(k, v){
										if(k == 'game_dates')
											return;
										
										a.push({
											id : v.league_id,
											name : v.league_name,
											score : v.score,
											rank : v.rank_in_league,
											league_team_id : v.league_team_id
										});
									});

									if(response.game_dates)
										app.pages.home.model.set('game_dates', response.game_dates);
									return a;
								},

								sortBy : function(prop, descendent){
								/*	this.comparator = function(model){
										return model.get(prop);
									}

									this.sort();
									if(descendent)
										this.models = this.models.reverse();
									this.trigger('reorder');*/
								}
						}),

						_model : Backbone.Model.extend({
							initialize : function(){
								this.leagues = new app.pages.home.leagues();
								this.on('change:selectedLeague', this.goToLeague, this)
							},

							goToLeague : function(){
								


								var m = this.get('selectedLeague'),
									i = _.indexOf(this.leagues.models, m);
									
								if(m == undefined)
									return false;	

								$.mobile.loading('show');

								$.each('name id score rank'.split(' '), function(i, v){
									app.pages.leagueDetails.model.set(v, m.get(v),{silent: true});
								});


								app.pages.leagueDetails.model.set('selectedIndex', i);
								app.pages.leagueDetails.model.set('hasLeft', i>0);
								app.pages.leagueDetails.model.set('hasRight', i<this.leagues.models.length-1);


								app.pages.leagueDetails.model.update(true, (this.lastSelectedLeagueIndex && this.lastSelectedLeagueIndex > i));
								
								this.lastSelectedLeagueIndex = i;
							},
							
							update : function(changePage){
								var self = this;

								this.leagues.fetch({
									dataType : 'jsonp',
									success : function(){
										app.pages.home.model.view.render();
									},
									error : function(){

									}
								});
							}
						}),

						_view : Backbone.View.extend({
							el : '#home',
						//	model : app.pages.home.model,
							initialize : function(){
								this.model.view = this;
								//this.pageName = this.$el.attr('class').replace(/.*?\bpage_(.*?)\b.*?/,'$1');
								this.pageName = this.$el.attr('id');
							},
							events : {
								'click .leagues-wrapper>.list-header>div' : 'sortLeagues'
							},
							render : function(doNotChangePage){
								if(this.pageName == 'home')
									this.$('.greeting .user-name').text(app.user.user_first_name);
								
								var leaguesContainer = this.$('.leagues').children(':not(.list-header)').remove().end();
								
								this.model.leagues.each(function(el, i){
									leaguesContainer.append(el.view.render());
								});
							},
							sortLeagues : function(e){
								this.model.leagues.sortBy($(e.target).attr('class').replace(/.*?\bleague-(.*?)\b.*?/,'$1'));
							}
						})
					}
				};


			

				$.extend((app.pages.ranks = {}),{
					_model : Backbone.Model.extend({
						initialize : function(){
							this.leagues = new app.pages.home.leagues();
							this.leagues.url = app.urls.ranks;
						},
						
						update : function(){
							var self = this;
							this.leagues.fetch({
								dataType : 'jsonp',
								success : function(){
									self.view.render();
								},
								error : function(){

								}
							});
						}
					}),
					_view : app.pages.home._view.extend({
						el : '#ranks'
					})
				});			


				$.extend((app.pages.leagueDetails = {}),{
					gameModel : Backbone.Model.extend({
						defaults : {
							teams : {
								home : {
									name : '',
									score : '',
									userScore : ''
								},
								visitors : {
									name : '',
									score : '',
									userScore : ''
								}
							},
							template : _.template($('#league-game-template').html())
						},

						initialize : function(){
							this.on('change:homeUserScore change:visitorsUserScore', this.updateScore, this);
							//this.on('change:user_score_1 change:user_score_2', this.updateScore, this);

							var viewName;
							if(this.get('isProp'))
								{
									if(this.get('isRandomProp'))
										{
											this.set('template', _.template($('#league-random-prop-template').html()));
											viewName = 'randomPropView';
										}
									else
										{
											this.set('template', _.template($('#league-prop-template').html()));
											viewName = 'propView';
										}
								}
							else
								viewName = 'gameView';


							viewName = 'gameView';

							this.view = new app.pages.leagueDetails[viewName]({model : this});
						},

						updateScore : function(){


							var currentRequest = this.get('currentRequest'),
								teams = this.get('teams'),
								data, method;

							if(this.get('isProp'))
								{
									method = 'saveProp';
									data = {
										props_id : this.get('props_id'),
										league_team_id : this.get('league_team_id')
									};

									if(this.get('isRandomProp'))
										{
											data.prop_answer = this.get('user_score_1');
										}
									else
										{
											data.user_score_1 = this.get('user_score_1');
											data.user_score_2 = this.get('user_score_2');
										}
								}
							else
								{
									method = 'saveGameScore';
									data = {
										user_score_1 : this.get('user_score_1'),
										user_score_2 : this.get('user_score_2'),
										game_id : this.get('game_id'),
										league_team_id : this.get('league_team_id')
	//									league_team_id : app.pages.leagueDetails.model.get('id')
									};
								}

							if(currentRequest)
								currentRequest.abort();

							this.set('currentRequest',
								app.request({
									data : data,
									method : method,
									success : function(){
									},
									fail : function(){
									}
								})
							);
						}
					}),

					
					gameView : Backbone.View.extend({
						tagName : "li",
						className : 'league-game',
						render : function(){
							return this.$el
									.html(this.model.get('template')(this.model.toJSON()))
									.toggleClass('in-play', this.model.get('inPlay'))
									.toggleClass('final', !this.model.get('inPlay') && !this.model.get('editable'));
						},
						events : {
							'change input.game-home-user-score' : 'changeHomeUserScore',
							'change input.game-visitors-user-score' : 'changeVisitorsUserScore',
							'focus input' : 'focusInput',
							'blur input' : 'blurInput'
						},
						focusInput : function(e){
							var input = $(e.target),
								index = input.index();

							input.closest('li').children().each(function(){
								$(this).children().eq(index).addClass('focused');
							});
						},
						blurInput : function(e){
							var input = $(e.target),
								index = input.index();

							input.closest('li').children().each(function(){
								$(this).children().eq(index).removeClass('focused');
							});
						},
						changeHomeUserScore : function(e){

							var teams = this.model.get('teams');
							teams.home.userscore = $(e.target).val();
							this.model.set('teams', teams);

							this.model.set('user_score_1', $(e.target).val());
							this.model.trigger('change:homeUserScore');
						},
						changeVisitorsUserScore : function(e){
							var teams = this.model.get('teams');
							teams.visitors.userscore = $(e.target).val();
							this.model.set('teams', teams);
							this.model.set('user_score_2', $(e.target).val());
							this.model.trigger('change:visitorsUserScore');
						}
					}),
					
					games : Backbone.Collection.extend({
						initialize : function(){
							this.model = app.pages.leagueDetails.gameModel;
						},
						comparator : function(model){
							return model.get('isProp') 
										? model.get('isRandomProp')
											?  2
											: 1
										: -1;
						},
						parse : function(response) {

							if(!app.validateResponse(response))
								return;

							function updateEl(el){
								var string = (el.start_time||el.timeframe).toLowerCase().replace(/(\s|\t|\n)+/, '');
								el.final = /final/.test(string);
								el.inPlay = /inplay/.test(string);
								el.editable = !(el.final || el.inPlay);
								return el;
							}

							var games = [],
								props = [];

							$.each(response.data.games, function(i, el){
								games.push(updateEl(el));
							});

							$.each(response.data.props, function(i, el){
								el = updateEl(el);
								el.isProp = true;
								el.isRandomProp = (el.props_type_id == 2);
								
								if(el.isRandomProp && !el.final)
									el.props_answer = "N/A";

								props.push(el);
							});

							if(response.data.info)
								app.pages.leagueDetails.model.set('info', response.data.info);
								
							return games.concat(props);
						}
					}), 

					_model : Backbone.Model.extend({
						defaults : { 
							template : _.template($('#league-details-template').html()),
							date_diff : 0,
							formattedDate : app.util.formatDate()
						},
						initialize : function(){
							this.games = new app.pages.leagueDetails.games();	

							this.on('change:info', function(){
								var info = this.get('info');
								if(info)
									this.set('formattedDate', app.util.formatDate(info.timestamp));
							}, this);
							

							this.on('change:id', function(){
								// reset the date_diff withouth triggering the event
								this.set({'date_diff' : 0}, {silent : true});
							}, this);

							this.on('change:date_diff', function(){
								this.update(true, this.get('date_diff') < 0);
							});
						},
						
						update : function(changePage, rightToLeftTransition){
							$.mobile.loading('show');

							var self = this;
							this.games.url = function(){
								return _.template(app.urls.getLeagueGames,{
									id : self.get('id'),
									date_diff : self.get('date_diff')
								});
							};
							this.games.fetch({
								dataType : 'jsonp',
								success : function(){

									self.view.render(changePage, rightToLeftTransition);
									$.mobile.loading('hide');
								},
								error : function(){

								}
							});
						}
					}),
					_view : app.pages.home._view.extend({
					//	el : '#leagueDetails1',
						events : {
							'vclick .nextDate.arrow-right.active' :  'incrementDate',
							'vclick .prevDate.arrow-left.active' :  'decrementDate',
							'vclick .league_header .arrow-right.active' : 'nextLeague',
							'vclick .league_header .arrow-left.active' : 'prevLeague'
						},
						render : function(changePage, rightToLeftTransition){

							if(changePage)
								{
									var nextPage = app.getNextLeagueDetailsPage();
									this.setElement(nextPage.get(0));
								}

							var tempGamesContainers = $('<div/>');


							var reachedProp = reachedRandomProp = false,
								headerTemplate = _.template(['<li class="prop-header list-header"><div class="ui-grid-b list-header">',
								                    '<div class="ui-block-a league-name league-prop"><span class="splitter">|</span><%=h1%></div>',
								                    '<div class="ui-block-b league-score league-prop"><span class="splitter">|</span><%=h2%></div>',
								                    '<div class="ui-block-c league-rank league-prop"><span class="splitter">|</span><%=h3%></div>',
								               '</div></li>'].join(''));
							this.model.games.each(function(el, i){
								var $html = el.view.render();

								if(el.get('isProp'))
									{
										$html.addClass('prop');
										if(!reachedProp)
											{
												reachedProp = true;
												tempGamesContainers.append(headerTemplate({
													h1 : 'players',
													h2 : 'correct answer',
													h3 : 'your answer'
												}));
											}	
										else if(!reachedRandomProp && el.get('isRandomProp'))
											{
												reachedRandomProp = true;
												
												tempGamesContainers.append(headerTemplate({
													h1 : 'question',
													h2 : 'correct answer',
													h3 : 'your answer'
												}));
											}
									}


								tempGamesContainers.append($html);
							});
							//this.model.set('gamesHtml', tempGamesContainers.html())

							this.$('.league-details-wrapper')
								.html(
									this.model.get('template')(this.model.toJSON())
								)
								.find('.games')
									.children(':not(.initial-header)')
										.remove()
										.end()
									.append(tempGamesContainers.children());

							if(this.model.games.models.length == 0)
								this.$('.league-details-wrapper .games').html('<center><h3>No games scheduled</h3></center>');


							if(changePage)
								{
									// save the initial transition direction value
									var initialTransitionReverseDirection = $.mobile.changePage.defaults.reverse;

									// force a reverse transition if "rightToLeftTransition" flag enabled
									$.mobile.changePage.defaults.reverse = rightToLeftTransition;

									// change the page
									$.mobile.changePage(nextPage,{
									//	changeHash : true,
									//	allowSamePageTransition : true,
									//	dataUrl : window.location.hash
									});

									// change the default transition direction back to te initial value
									$.mobile.changePage.defaults.reverse = initialTransitionReverseDirection;
								}

							return this.$el;

						},
						incrementDate : function(){
							var date_diff = this.model.get('date_diff');
							this.model.set('date_diff', date_diff + 1);
						},
						decrementDate : function(){							
							var date_diff = this.model.get('date_diff');
							this.model.set('date_diff', date_diff - 1);
						},
						nextLeague : function(){
							app.pages.home.model.set('selectedLeague', app.pages.home.model.leagues.models[this.model.get('selectedIndex') + 1]);
						},
						prevLeague : function(){
							app.pages.home.model.set('selectedLeague', app.pages.home.model.leagues.models[this.model.get('selectedIndex') - 1]);
						}
					})
				});


				$.each(app.pages, function(k, v){
					if(v._model)
						v.model = new v._model;
					if(v._view)
						v.view = new v._view({model:v.model});
				});

				return this;
			},

			init : function(){

				this
					.initPages()
					.initRouter()
					.bindEventHandlers()
					.initPing();



		/*
				to be removed!!!
				auto-login for testing purposes
		*/
		/*	    	
			$('#login_user').val('diana@xivic.com');
	    	$('#login_password').val('develop');
			$('#login_form').trigger('submit');
		*/

				
				app.navigate(window.location.hash);

				return this;
			}
		});
		

		global.app = app;
	});
})(this, jQuery, _, Backbone)