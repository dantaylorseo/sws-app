var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('online', this.onOnline, false);
        document.addEventListener('offline', this.onOffline, false);
    },
    onDeviceReady: function() {
        //console.log(navigator.connection.type);
        FastClick.attach(document.body);
        /*cordova.plugins.printer.isAvailable(
            function (isAvailable) {
                console.log(isAvailable ? 'Service is available' : 'Service NOT available');
            }
        );*/
		var online = 0;
		var obsArray = [];
        renderPage();
    },
    onOnline: function() {
        console.log("Doing sync...");
        $("#offline").slideUp(1000);
        $("#online").slideDown(1000);
        
		online = 1;
		console.log( online );
    },
    onOffline: function() {
        console.log("Working offline");
        $("#online").slideUp(1000);
        $("#offline").slideDown(1000);
		online = 1;
    }
};

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
}

function errorCB(err) {
    console.log("Error processing SQL: ");
    console.log(err);
}

function successCB() {
    console.log("Databases created!");
}


function populateDB(tx) {
    // Drop tables - remove in production 
    var cleardb = 1;
    if(cleardb == 1) {
        tx.executeSql('DROP TABLE IF EXISTS client');
        tx.executeSql('DROP TABLE IF EXISTS obs');
        tx.executeSql('DROP TABLE IF EXISTS report');
        tx.executeSql('DROP TABLE IF EXISTS user');
    }

    // Create tables
    tx.executeSql('CREATE TABLE IF NOT EXISTS client (clientID TEXT PRIMARY KEY, clientName TEXT, clientContract TEXT, clientWork TEXT, clientLogo TEXT, clientActive INTEGER DEFAULT "1", clientCreated TEXT DEFAULT CURRENT_TIMESTAMP, clientUpdated TEXT DEFAULT CURRENT_TIMESTAMP)');
    
    tx.executeSql('CREATE TABLE IF NOT EXISTS obs (obsID TEXT PRIMARY KEY, obsReport TEXT, obsItem INTEGER, obsObs TEXT, obsPriority TEXT, obsMedia TEXT, obsCreated TEXT DEFAULT CURRENT_TIMESTAMP, obsUpdated TEXT DEFAULT CURRENT_TIMESTAMP, obsSync INTEGER DEFAULT 0)');
    
    tx.executeSql('CREATE TABLE IF NOT EXISTS report (reportID TEXT PRIMARY KEY, reportClient TEXT, reportWork TEXT, reportContract TEXT, reportDate TEXT, reportTime TEXT, reportTick TEXT, reportUser TEXT, reportClientSig TEXT, reportUserSig TEXT, reportCreated TEXT DEFAULT CURRENT_TIMESTAMP, reportUpdated TEXT DEFAULT CURRENT_TIMESTAMP, obsSync INTEGER DEFAULT 0)');
    
    tx.executeSql('CREATE TABLE IF NOT EXISTS user (userID TEXT PRIMARY KEY, userName TEXT, userEmail TEXT, userPass TEXT, userActive INTEGER DEFAULT "1", userType INTEGER DEFAULT "0", userCreated TEXT DEFAULT CURRENT_TIMESTAMP, userUpdated TEXT DEFAULT CURRENT_TIMESTAMP)');
    
    userID = generateUUID();
    
    tx.executeSql('CREATE TRIGGER userUpdate AFTER UPDATE OF userID, userEmail, userPass, userActive, userType ON user FOR EACH ROW BEGIN UPDATE user SET userUpdated = datetime() WHERE userID = old.userID; END;');
    
    tx.executeSql('CREATE TRIGGER clientUpdate AFTER UPDATE OF clientID, clientName, clientContract, clientWork, clientLogo, clientActive ON client FOR EACH ROW BEGIN UPDATE client SET clientUpdated=datetime() WHERE clientID=OLD.clientID; END;');
    
    tx.executeSql('CREATE TRIGGER obsUpdate AFTER UPDATE OF obsID, obsReport, obsItem, obsObs, obsPriority, obsMedia ON obs FOR EACH ROW BEGIN UPDATE obs SET obsUpdated=datetime() WHERE obsID=OLD.obsID; END;');
    
    tx.executeSql('CREATE TRIGGER reportUpdate AFTER UPDATE OF reportID, reportClient, reportWork, reportContract, reportDate, reportTime, reportTick, reportUser, reportClientSig, reportUserSig ON report FOR EACH ROW BEGIN UPDATE report SET reportUpdated=datetime() WHERE reportID=OLD.reportID; END;');
    
    
}
function get_users() {
	
	// TODO: Add a check on last updated column
	
	$.get( 'http://sws.tailoreddev.co.uk/ajax/get-users.php', function( data ) {
		var db = window.openDatabase("sws_db", "1.0", "SWS Database", 200000);
		$.each( data, function ( i, item ) {
			
			var query = 'INSERT OR REPLACE INTO user ( userID, userName, userEmail, userPass, userActive, userType, userCreated ) VALUES ( "'+data[i].userID+'", "'+data[i].userName+'", "'+data[i].userEmail+'", "'+data[i].userPass+'", "'+data[i].userActive+'", "'+data[i].userType+'", "'+data[i].userCreated+'" )';
			console.log( query );
			db.transaction( 
				function( tx ) {
					tx.executeSql( query ); 
				}
			);
		});
	}, 'json' );
}
function renderPage() {
	console.log( 'Online: '+online );
    if(window.localStorage.userID != undefined) {
        
    } else {
        $('.login-modal').modal({
          backdrop: 'static',
          keyboard: false,
          show: true
        });
    }
    var db = window.openDatabase("sws_db", "1.0", "SWS Database", 200000);
    db.transaction(populateDB, errorCB, successCB);
	var loadtest = 0;
	var obsArray = [];
    $(document)
	.ready( function(e) {
		

		//if( online == 1 ) {
            get_users();
        //}
	})
    .on("click", ".logout", function(event) {
        event.preventDefault();
        localStorage.clear();
        $('.login-modal').modal({
          backdrop: 'static',
          keyboard: false,
          show: true
        });
    })
    .on("submit", ".login-modal form", function(event) {
        event.preventDefault();
        
        var user = $('#usernamelogin').val();
        var pass = $('#passwordlogin').val();
        
		if( online === 1) {
			$.get('http://sws.tailoreddev.co.uk/app/sync_user.php', 'user='+user, function( data ) {
				console.log(data);
			}, 'json' );
		}
		
        db.transaction(
			function(tx) {
				tx.executeSql("SELECT userID, userEmail, userPass FROM user WHERE userEmail='" + user.trim() + "'", [], function(tx, rs) 
				{
					if (rs.rows.item(0).userPass == pass.trim()) {
						window.localStorage.userID = rs.rows.item(0).userID;
						$('.login-modal').modal('hide');
					} else {
						console.log("error " + rs.rows.item(0).userPass + " " + pass);
					}
				}, errorCB );
        	}, function() { 
				navigator.notification.alert(
					'\nYour login has failed\n\nPlease check your email address and password and try again.',
					function() {},
					'Login failed',
					'Retry'
				);
        	}
		);
    })
    .on("click", ".innerlink", function(e) {
        e.preventDefault();
        var link = $(this).attr('href');
        $('.innerlink').removeClass('active');
        $(this).addClass('active');
        var title = $(this).attr('title');
        $("#ajaxdata").remove();
		
        $("#main").load(link, function() {
            $('.navbar-fixed-top .navbar-brand').html(title);
            
            if(link == 'reports.html') {
                
               var reportQ = "SELECT clientName, reportDate, reportTime, reportID, COUNT (obsItem) AS obss FROM report INNER JOIN client ON clientID = reportClient LEFT JOIN obs ON reportID = obsReport GROUP BY reportID ORDER BY reportDate ASC, reportTime ASC";
                db.transaction(
                    function(tx) {
                        var output = '';
                        tx.executeSql(reportQ, [], function(tx, rs) {
                            for (var i = 0; i < rs.rows.length; i++) {
                                var obsOut = rs.rows.item(i).obss+' Observations';
                                output += '<a href="report-detail.html" class="list-group-item view-report" rel="'+rs.rows.item(i).reportID+'"><h4 class="list-group-item-heading">'+rs.rows.item(i).clientName+'</h4><i class="pull-right glyphicon glyphicon-chevron-right"></i><p class="list-group-item-text">Produced '+rs.rows.item(i).reportDate+' at '+rs.rows.item(i).reportTime+' by User - '+obsOut+'</p></a>';
                            }
                            $("#reportList").html(output);
                        }, errorCB);
                    }, errorCB);
                
            } else if(link == 'new-report.html' || link == 'admin.html') {
				console.log( loadtest );
				
				arrayid = generateUUID();
				$("#newObs .obsID").val(arrayid);
				var obsID = $("#newObs .obsID").val();
                if( loadtest == 0 ) {
					reportPage();
					loadtest++;
				} else {
					obsArray[obsID] = [];
				}
            }
            
        });
    })
    .on("click", ".view-report", function(event) {
        event.preventDefault();
        var reportID = $(this).attr('rel');
        console.log(reportID);
        $('.navbar-fixed-top .navbar-brand').html('Report Detail');
        $("#main").load("report-detail.html #ajaxdata", function(event) {
            reportDetail(reportID);   
        });
    });
}

function reportDetail(reportID) {
    var db = window.openDatabase("sws_db", "1.0", "SWS Database", 200000);
    var query = 'SELECT * FROM report INNER JOIN client ON clientID = reportClient WHERE reportID="'+reportID+'"';
    db.transaction(
        function(tx) {
            tx.executeSql(query, [], function(tx, rs) {
                $('#clientID').val(rs.rows.item(0).clientName);
                $('#clientContract').val(rs.rows.item(0).clientContract);
                $('#clientWork').val(rs.rows.item(0).clientWork);
                $('#reportDate').val(rs.rows.item(0).reportDate);
                $('#time').val(rs.rows.item(0).reportTime);
                console.log(rs.rows.item(0).reportTick);
                var ticksString = rs.rows.item(0).reportTick.replace(',}', '}');
                var ticks = jQuery.parseJSON( ticksString );
                for(var x = 1; x<=33; x++) {
                    if(ticks[x] > 0) {
                        $(".totalBox"+x).html(ticks[x]).css('background-color', 'red');
                    }
                }
            }, errorCB);
        }, errorCB
    );
    
    var obsQuery = 'SELECT * FROM obs WHERE obsReport="'+reportID+'" ORDER BY obsItem ASC';
    db.transaction(
        function(tx) {
            tx.executeSql(obsQuery, [], function(tx, rs) {
                if(rs.rows.length > 0) {
                    $('.swstable tr.nodata').remove();
                }
                for (var i = 0; i < rs.rows.length; i++) {
                    $('.swstable').append('<tr><td>'+rs.rows.item(i).obsItem+'</td><td>'+rs.rows.item(i).obsObs+'</td><td>'+rs.rows.item(i).obsPriority+'</td><td>'+rs.rows.item(i).obsMedia+'</td></tr>');
                }
            }, errorCB);
        }, errorCB
    );
    
}

function reportPage() {
    var db = window.openDatabase("sws_db", "1.0", "SWS Database", 200000);
	var obsArray = [];
	var obsID = $("#newObs .obsID").val();
	obsArray[obsID] = [];
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes() < 10 ? '0' : '';
    m += d.getMinutes();
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();

    var clientQ = "SELECT * FROM client ORDER BY clientName ASC";
    db.transaction(
        function(tx) {
            var output = '';
            tx.executeSql(clientQ, [], function(tx, rs) {
                for (var i = 0; i < rs.rows.length; i++) {
                    output += '<option value="' + rs.rows.item(i).clientID + '">' + rs.rows.item(i).clientName + ' (' + rs.rows.item(i).clientID + ')</option>';
                }
                $("#clientID").html(output);
            }, errorCB);
        }, errorCB);

    $('.datepicker').val(day + '/' + month + '/' + year);

    $('#time').val(h + ':' + m);
    var sigCapture = null;
    
    
    $(document).ready(function(e) {

        sigCapture = new SignatureCapture("signature");
    });
    
        $(document)
        
    .on("click", ".clearsig", function(event) {
        event.preventDefault();
        sigCapture = new SignatureCapture("signature");
    })
        
    .on("click", ".printform", function(event) {
        event.preventDefault();
        var page = $("#ajaxdata").html();
        console.log('In print');
        cordova.plugins.printer.print(page, {name: 'Report Detail', greyscale: true }, function () {
            console.log('printing finished or canceled')
        });
    })
    .on("click", ".addsig", function(event) {
        event.preventDefault();
        $('.signature1').modal('hide');
        var fields = {
            'sig': 'data:image/png; base64,' + sigCapture.toString(),
            'report': $('.sigReportID').val(),
        };
        var query = "UPDATE report SET reportClientSig=? WHERE reportID=?";
        //console.log( query );
        //console.log (fields );
        // Add signature image to database
        db.transaction(
            function(tx) {
                tx.executeSql(query, [fields.sig, fields.report], function(tx, rs) {
                    console.log("updated:" + fields.report);
                    navigator.notification.alert(
                        '\nYour report was successfully added.',
                        function() {},
                        'Report Added',
                        'OK'
                    );
                }, errorCB);
            }, errorCB
        );
        $('.sigimg').attr('src', 'data:image/png; base64,' + sigCapture.toString());
    })
    
        .on("click", '.subreport', function(e) {
            e.preventDefault();
            $(this).attr('disabled','disabled');
            $('#reportform').submit();
        })
        .on("submit", "#reportform", function(event) {
            event.preventDefault();

            var result = {};
            $.each($(this).serializeArray(), function() {
                result[this.name] = this.value;
            });
            var ticked = '{';
            for (var i = 1; i <= 33; i++) {
                if(i == 33) {
                    ticked += '"' + i + '":"' + result["inlineCheckbox[" + i + "]"] + '"';
                } else {
                    ticked += '"' + i + '":"' + result["inlineCheckbox[" + i + "]"] + '",';
                }
            }
            ticked += '}';
            var reportID = generateUUID();
            var query = "INSERT INTO report (reportID, reportClient, reportWork, reportContract, reportDate, reportTime, reportTick, reportUser) VALUES (?,?,?,?,?,?,?,?)";
            db.transaction(
                function(tx) {
                    tx.executeSql(query, [reportID, result.reportClient, result.reportWork, result.reportContract, result.reportDate, result.reportTime, ticked, window.localStorage.userID], function(tx, rs) {
                        
                        var obsQuery = "INSERT INTO obs (obsReport, obsID, obsItem, obsObs, obsPriority) VALUES (?,?,?,?,?)";
						var obsID = $('.obsID').val();
						console.log(obsArray[obsID]);
                        $.each(obsArray[obsID], function() {
                            
                            var obsID = generateUUID();
                            tx.executeSql(obsQuery, [reportID, obsID, this.obsItem, this.obsObs, this.obsPriority], function(tx, rs) {console.log('inserted obs:'+obsID);}, errorCB);
                        
                        });
                        
                        console.log("inserted report:"+reportID);
                        $(".sigReportID").val(reportID);
                        $('.signature1').modal('show');
                    }, errorCB);
                }, errorCB
            );
            $('.subreport').removeAttr('disabled');

        })
        .on("submit", "#newClient", function(e) {
            e.preventDefault();
            $("#newClient input[type=submit]").attr('disabled', 'disabled');
            var query = "INSERT INTO client (clientID, clientName, clientContract, clientWork, clientActive) VALUES (?,?,?,?,?)";
            var clientID = generateUUID();
            var result = {};
            $.each($(this).serializeArray(), function() {
                result[this.name] = this.value;
            });

            function updateClients() {

                var clientQ = "SELECT * FROM client GROUP BY clientID ORDER BY clientName ASC";
                db.transaction(
                    function(tx) {
                        console.log('in');
                        var output = '<option disabled selected>Select Client</option>';
                        tx.executeSql(clientQ, [], function(tx, rs) {
                            for (var i = 0; i < rs.rows.length; i++) {
                                output += '<option value="' + rs.rows.item(i).clientID + '">' + rs.rows.item(i).clientName + ' (' + rs.rows.item(i).clientID + ')</option>';
                            }
                            $("#clientID").html(output);
                        }, errorCB);
                    }, errorCB);
            }
            db.transaction(
                function(tx) {
                    tx.executeSql(query, [clientID, result.clientNamem, result.clientContractm, result.clientWorkm, "1"], function(tx, rs) {
                        console.log(rs.insertId);
                        $('.innerlink').removeClass('active');
                        $(".dashboard").addClass('active');
                        //updateClients();
                        $("#newClient input[type=submit]").removeAttr('disabled');
                        var title = $(".dashboard").attr('title');
                        $("#main").load("index.html #ajaxdata", function() {
                            $('.navbar-fixed-top .navbar-brand').html(title);

                        });
                    }, errorCB);
                }, errorCB);
        })
        
        .on("click", ".tickboxes .addObsButton", function(e) {
            e.preventDefault();
            var str = $(this).attr('rel');
            var str2 = $(this).attr('data-title');
            $(".newobs #obsItem").val(str);
            $(".newobs #obsName").val(str2);
            $('#newObs input[text]').val('');
            $('#newObs textarea').val('');
            $("#newObs .obsImages").val('0');
            $('.media div').remove();
            $('#newObs .obsPriority').val('null');
			
            $(".newobs").modal("show");
            $('.addobssub').removeAttr('disabled');
        })
        .on("click", ".addobssub", function(e) {
            $(this).attr('disabled','disabled');
            $('#newObs').submit();
        })
        .on("submit", "#newObs", function(e) {
            e.preventDefault();
            $(".nodata").remove();
            var result = {};
            var error = 0;
            $.each($(this).serializeArray(), function() {
                result[this.name] = this.value;
            });
            if (typeof result.obsPriority === 'undefined') {
                //alert("Please select a priority");
                error++;
            } 
            if (result.obsObs == "") {
                //alert("Please enter an observation");
                error++;
            } 
            if( error == 0 ) {
				var obsID = result.obsID;
				if( typeof obsArray[obsID] === 'undefined' ) {
					obsArray[obsID] = [];
				}
                obsArray[obsID].push(result);
				
                var priorityClass = result.obsPriority.split(" ");
                priorityClass = 'priority_'+priorityClass[0];
                var output = '<tr><td>' + result.obsItem + '</td><td>' + result.obsObs + '</td><td class="'+priorityClass+'">' + result.obsPriority + '</td><td>' + result.obsImages + '</td><td><button class="btn btn-primary btn-xs"><span class="glyphicon glyphicon-pencil"></span></button> <button class="btn btn-danger btn-xs"><span class="glyphicon glyphicon-trash"></span></button></td></tr>';
                $('.swstable').append(output);
                var curr = $('.totalBox' + result.obsItem).html();
                $('.totalBox' + result.obsItem).html(+curr + 1).css('background-color', 'red');
                $('#inlineCheckbox' + result.obsItem).val(+curr + 1);
                $(".newobs").modal("hide");
                $('#newObs input[text]').val('');
                $('#newObs textarea').val('');
                $("#newObs .obsImages").val('0');
                $('.media div').remove();
                $('#newObs .obsPriority').val('select');
                console.log('end');
            }
            $('.addobssub').removeAttr('disabled');
			console.log(obsArray);
        })
        
        .on("click", ".addmedia", function(e) {
            e.preventDefault();
            navigator.camera.getPicture(onSuccess, onFail, {
                destinationType: Camera.DestinationType.DATA_URL
            });
        })
        .on("click", ".addmedialib", function(e) {
            e.preventDefault();
            navigator.camera.getPicture(onSuccess, onFail, {
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY
            });
        })
        .on("click", ".clientlogoadd", function(e) {
            e.preventDefault();
            navigator.camera.getPicture(clientLogoSuccess, onFail, {
                destinationType: Camera.DestinationType.DATA_URL
            });
        })
        .on("click", ".clientlogoaddlib", function(e) {
            e.preventDefault();
            navigator.camera.getPicture(clientLogoSuccess, onFail, {
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY
            });
        })
        .on("click", ".removemedia", function(e) {
            e.preventDefault();
            $(this).parent().fadeOut(1000).remove();
        })
        .on('click', '.dropdown-menu.dropdown-menu-form', function(e) {
            e.stopPropagation();
        });

    function onSuccess(imageData) {
        var i = $("#newObs .obsImages").val();
        $(".media").append('<div class="col-sm-2"><a href="#" class="removemedia"><span class="glyphicon glyphicon-remove"></span></a><img src="data:image/jpeg;base64,' + imageData + '" /></div><input type="hidden" name="obsImage[' + i + ']" value="data:image/jpeg;base64,' + imageData + '" />');
        i = +i + 1;
        $("#newObs .obsImages").val(i);
    }
    
    function clientLogoSuccess(imageData) {
        $('.clientlogo').val( 'data:image/jpeg;base64,' + imageData );
        //console.log( imageData );
        $('.clientlogocont').html('<div class="col-sm-2"><img class="img-responsive" src="data:image/jpeg;base64,' + imageData + '" /></div>');
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }
    
}