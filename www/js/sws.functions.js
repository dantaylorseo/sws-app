"use strict";
var online = 0;
var app = {
    initialize: function () {
        this.bindEvents();
    },
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('online', this.onOnline, false);
        document.addEventListener('offline', this.onOffline, false);
    },
    onDeviceReady: function () {
        //console.log(navigator.connection.type);
        FastClick.attach(document.body);
        /*cordova.plugins.printer.isAvailable(
            function (isAvailable) {
                console.log(isAvailable ? 'Service is available' : 'Service NOT available');
            }
        );*/

        //var obsArray = [];
        var db = open_db();
        renderPage();
    },
    onOnline: function () {
        console.log("Doing sync...");
        $("#offline").slideUp(1000);
        $("#online").slideDown(1000);

        online = 1;
        console.log(online);
    },
    onOffline: function () {
        console.log("Working offline");
        $("#online").slideUp(1000);
        $("#offline").slideDown(1000);
        online = 0;
    }
};
var db_ver = "1.5";

function open_db() {

    try {
        if (!window.openDatabase) {
            alert('not supported');
        } else {
            var shortName = 'sws_db';
            var displayName = 'SWS Database';
            var maxSize = 655367; // in bytes
            var db = openDatabase(shortName, "", displayName, maxSize);
            if (db.version != db_ver) {
                db.changeVersion("", db_ver, function (t) {

                });
            }
            return db;
        }
    } catch (e) {
        // Error handling code goes here.
        if (e == INVALID_STATE_ERR) {
            // Version number mismatch.
            alert("Invalid database version.");
        } else {
            alert("Unknown error " + e + ".");
        }
        return;
    }
}

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
    if (cleardb == 1) {
        tx.executeSql('DROP TABLE IF EXISTS client');
        tx.executeSql('DROP TABLE IF EXISTS obs');
        tx.executeSql('DROP TABLE IF EXISTS report');
        tx.executeSql('DROP TABLE IF EXISTS user');
        tx.executeSql('DROP TABLE IF EXISTS contact');
        tx.executeSql('DROP TABLE IF EXISTS contract');
        tx.executeSql('DROP TABLE IF EXISTS image');
    }

    // Create tables
    tx.executeSql('CREATE TABLE IF NOT EXISTS client (clientID TEXT PRIMARY KEY, clientName TEXT, clientEmail TEXT, clientLogo TEXT, clientActive INTEGER DEFAULT "1", clientCreated TEXT DEFAULT CURRENT_TIMESTAMP, clientUpdated TEXT DEFAULT CURRENT_TIMESTAMP)');

    tx.executeSql('CREATE TABLE IF NOT EXISTS obs (obsID TEXT PRIMARY KEY, obsReport TEXT, obsItem TEXT, obsObs TEXT, obsPriority TEXT, obsMedia TEXT, obsCreated TEXT DEFAULT CURRENT_TIMESTAMP, obsUpdated TEXT DEFAULT CURRENT_TIMESTAMP )');

    tx.executeSql('CREATE TABLE IF NOT EXISTS report (reportID TEXT PRIMARY KEY, reportClient TEXT, reportWork TEXT, reportContract TEXT, reportDate TEXT, reportTime TEXT, reportTick TEXT, reportUser TEXT, reportPrevAvail TEXT, reportPrevAction TEXT, reportClientSig TEXT, reportUserSig TEXT, reportCreated TEXT DEFAULT CURRENT_TIMESTAMP, reportUpdated TEXT DEFAULT CURRENT_TIMESTAMP )');

    tx.executeSql('CREATE TABLE IF NOT EXISTS user (userID TEXT PRIMARY KEY, userName TEXT, userEmail TEXT, userPass TEXT, userActive INTEGER DEFAULT "1", userType INTEGER DEFAULT "0", userCreated TEXT DEFAULT CURRENT_TIMESTAMP, userUpdated TEXT DEFAULT CURRENT_TIMESTAMP)');

    tx.executeSql('CREATE TABLE IF NOT EXISTS contact (contactID TEXT PRIMARY KEY, contactName TEXT, contactClient TEXT, contactEmail TEXT, contactTel TEXT, contactActive INTEGER DEFAULT "1", contactCreated TEXT DEFAULT CURRENT_TIMESTAMP, contactUpdated TEXT DEFAULT CURRENT_TIMESTAMP)');

    tx.executeSql('CREATE TABLE IF NOT EXISTS contract (contractID TEXT PRIMARY KEY, contractClient TEXT, contractNumber TEXT, contractLocation TEXT, contractActive INTEGER DEFAULT "1", contractCreated TEXT DEFAULT CURRENT_TIMESTAMP, contractUpdated TEXT DEFAULT CURRENT_TIMESTAMP)');

    tx.executeSql('CREATE TABLE IF NOT EXISTS image (imageID TEXT PRIMARY KEY, imageObs TEXT, imageData TEXT )');

    tx.executeSql('CREATE TRIGGER userUpdate AFTER UPDATE OF userID, userEmail, userPass, userActive, userType ON user FOR EACH ROW BEGIN UPDATE user SET userUpdated = datetime() WHERE userID = old.userID; END;');

    tx.executeSql('CREATE TRIGGER clientUpdate AFTER UPDATE OF clientID, clientName, clientContract, clientWork, clientLogo, clientActive ON client FOR EACH ROW BEGIN UPDATE client SET clientUpdated=datetime() WHERE clientID=OLD.clientID; END;');

    tx.executeSql('CREATE TRIGGER obsUpdate AFTER UPDATE OF obsID, obsReport, obsItem, obsObs, obsPriority, obsMedia ON obs FOR EACH ROW BEGIN UPDATE obs SET obsUpdated=datetime() WHERE obsID=OLD.obsID; END;');

    tx.executeSql('CREATE TRIGGER reportUpdate AFTER UPDATE OF reportID, reportClient, reportWork, reportContract, reportDate, reportTime, reportTick, reportUser, reportClientSig, reportUserSig ON report FOR EACH ROW BEGIN UPDATE report SET reportUpdated=datetime() WHERE reportID=OLD.reportID; END;');


}

function get_users() {
    $('.users-sync .rem-icon').remove();
    // TODO: Add a check on last updated column
    $('.users-sync').append('<i class="fa fa-circle rem-icon fa-stack-2x"></i><i class="fa fa-circle-o-notch rem-icon fa-spin fa-stack-1x fa-inverse"></i>');
    $.get('http://sws.tailoreddev.co.uk/ajax/get-users.php', {
        "_": $.now()
    }, function (data) {
        var db = open_db();
        $.each(data, function (i, item) {

            var query = 'INSERT OR REPLACE INTO user ( userID, userName, userEmail, userPass, userActive, userType, userCreated ) VALUES ( "' + data[i].userID + '", "' + data[i].userName + '", "' + data[i].userEmail + '", "' + data[i].userPass + '", "' + data[i].userActive + '", "' + data[i].userType + '", "' + data[i].userCreated + '" )';
            //console.log( query );
            db.transaction(
                function (tx) {
                    tx.executeSql(query, [], function (tx, rs) {
                        console.log('Inserted user: ' + data[i].userName);
                    }, errorCB);
                }
            );
        });
        $('.users-sync .rem-icon').remove();
        $('.users-sync').append('<i class="fa fa-circle rem-icon fa-faded fa-stack-2x"></i><i class="fa rem-icon fa-check green-fa fa-stack-1x fa-inverse"></i>');
    }, 'json');
}

function get_clients() {
    $('.clients-sync .rem-icon').remove();
    $('.clients-sync').append('<i class="fa fa-circle rem-icon fa-stack-2x"></i><i class="fa fa-circle-o-notch rem-icon fa-spin fa-stack-1x fa-inverse"></i>');
    // TODO: Add a check on last updated column
    console.log('getting clients...');
    $.get('http://sws.tailoreddev.co.uk/ajax/get-clients.php', {
        "_": $.now()
    }, function (data) {
        var db = open_db();
        $.each(data, function (i, item) {

            var query = 'INSERT OR REPLACE INTO client ( clientID, clientName, clientEmail, clientActive, clientCreated ) VALUES ( "' + data[i].clientID + '", "' + data[i].clientName + '", "' + data[i].clientEmail + '", "' + data[i].clientActive + '", "' + data[i].clientCreated + '" )';
            //console.log( query );
            db.transaction(
                function (tx) {
                    tx.executeSql(query, [], function (tx, rs) {
                        console.log('Inserted client: ' + data[i].clientName);
                    }, errorCB);
                }, errorCB
            );
        });
        $('.clients-sync .rem-icon').remove();
        $('.clients-sync').append('<i class="fa fa-circle rem-icon fa-faded fa-stack-2x"></i><i class="fa rem-icon fa-check green-fa fa-stack-1x fa-inverse"></i>');
    }, 'json').fail(function () {
        alert("error");
    });
}

function get_reports() {
    $('.reports-sync .rem-icon').remove();
    $('.reports-sync').append('<i class="fa fa-circle rem-icon fa-stack-2x"></i><i class="fa fa-circle-o-notch rem-icon fa-spin fa-stack-1x fa-inverse"></i>');
    // TODO: Add a check on last updated column
    console.log('getting reports...');
    $.get('http://sws.tailoreddev.co.uk/ajax/get-reports.php', {
        "_": $.now()
    }, function (data) {
        var db = open_db();
        $.each(data, function (i, item) {

            var query = "INSERT OR REPLACE INTO report ( reportID, reportClient, reportWork, reportContract, reportDate, reportTime, reportTick, reportUser, reportClientSig, reportUserSig, reportCreated ) VALUES ( '" + data[i].reportID + "', '" + data[i].reportClient + "', '" + data[i].reportWork + "', '" + data[i].reportContract + "', '" + data[i].reportDate + "', '" + data[i].reportTime + "', '" + data[i].reportTick + "', '" + data[i].reportUser + "', '" + data[i].reportClientSig + "', '" + data[i].reportUserSig + "', '" + data[i].reportCreated + "')";
            //console.log( query );
            db.transaction(
                function (tx) {
                    tx.executeSql(query, [], function (tx, rs) {
                        console.log('Inserted report: ' + data[i].reportID);
                    }, errorCB);
                }, errorCB
            );
        });
        console.log('getting obs...');
        $.get('http://sws.tailoreddev.co.uk/ajax/get-obs.php', {
            "_": $.now()
        }, function (data) {
            var db = open_db();
            $.each(data, function (i, item) {
                console.log('in');
                var query = "INSERT OR REPLACE INTO obs ( obsID, obsReport, obsItem, obsObs, obsPriority, obsMedia, obsCreated ) VALUES ( '" + data[i].obsID + "', '" + data[i].obsReport + "', '" + data[i].obsItem + "', '" + data[i].obsObs + "', '" + data[i].obsPriority + "', '" + data[i].obsMedia + "', '" + data[i].obsCreated + "')";
                //console.log( query );
                db.transaction(
                    function (tx) {
                        tx.executeSql(query, [], function (tx, rs) {
                            console.log('Inserted obs: ' + data[i].obsID);
                        }, errorCB);
                    }, errorCB
                );
            });
        }, 'json');
        $('.reports-sync .rem-icon').remove();
        $('.reports-sync').append('<i class="fa fa-circle fa-faded rem-icon fa-stack-2x"></i><i class="fa rem-icon fa-check green-fa fa-stack-1x fa-inverse"></i>');
    }, 'json').fail(function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
    });
}


function get_contracts() {

    // TODO: Add a check on last updated column
    console.log('getting contracts...');
    $.get('http://sws.tailoreddev.co.uk/ajax/get-contracts.php', {
        "_": $.now()
    }, function (data) {
        var db = open_db();
        $.each(data, function (i, item) {

            var query = 'INSERT OR REPLACE INTO contract ( contractID, contractClient, contractNumber, contractLocation, contractActive, contractCreated, contractUpdated ) VALUES ( "' + data[i].contractID + '", "' + data[i].contractClient + '", "' + data[i].contractNumber + '", "' + data[i].contractLocation + '", "' + data[i].contractActive + '", "' + data[i].contractCreated + '", "' + data[i].contractUpdated + '" )';
            //console.log( query );
            db.transaction(
                function (tx) {
                    tx.executeSql(query, [], function (tx, rs) {
                        console.log('Inserted contract: ' + data[i].contractID);
                    }, errorCB);
                }, errorCB
            );
        });
    }, 'json');
}

function login(user, pass) {
    if (online === 1) {
        get_users();
    }
    var db = open_db();
    db.transaction(
        function (tx) {
            tx.executeSql("SELECT userID, userEmail, userPass FROM user WHERE userEmail='" + user.trim() + "'", [], function (tx, rs) {
                if (rs.rows.item(0).userPass == pass.trim()) {
                    window.localStorage.userID = rs.rows.item(0).userID;
                    $('.login-modal').modal('hide');
                } else {
                    console.log("error " + rs.rows.item(0).userPass + " " + pass);
                }
            }, errorCB);
        },
        function () {
            navigator.notification.alert(
                '\nYour login has failed\n\nPlease check your email address and password and try again.',
                function () {},
                'Login failed',
                'Retry'
            );
        }
    );
}

function renderPage() {
    console.log('Online: ' + online);
    /*if(window.localStorage.userID != undefined) {
        
    } else {
        $('.login-modal').modal({
          backdrop: 'static',
          keyboard: false,
          show: true
        });
    }
    */
    var db = open_db();
    db.transaction(populateDB, errorCB, successCB);
    var loadtest = 0;
    //var obsArray = [];
    $("a[target='_system']").click(function (event) {
        event.preventDefault();
        cordova.InAppBrowser.open($(this).attr("href"), '_system');
    });
    $(document)
        .ready(function (e) {

            $("#ajaxdata").remove();

            /*get_users();
            get_clients();
            get_reports();
            get_contracts();*/
            if (online === 1) {
                navigator.notification.confirm('Do you want to sync data now?', function (index) {
                    if (index === 1) {
                        var title = $('a.syncpage').attr('title');
                        $('a.dashboard').removeClass('active');
                        $('a.syncpage').addClass('active');
                        $("#main").load('sync.html', function () {
                            $('.navbar-fixed-top .navbar-brand').html(title);
                            $('.sync').trigger('click');
                        });
                    } else {
                        var title = $('a.dashboard').attr('title');
                        $("#main").load('dashboard.html', function () {
                            $('.navbar-fixed-top .navbar-brand').html(title);
                        });
                    }
                }, 'Sync Data?', ['Yes', 'No']);
            } else {
                var title = $('a.dashboard').attr('title');
                $("#main").load('dashboard.html', function () {
                    $('.navbar-fixed-top .navbar-brand').html(title);
                });
            }

            //if( online == 1 ) {

            //}
        })
        .on("click", ".sync", function (event) {
            event.preventDefault();
            get_users();
            get_clients();
            get_reports();
            get_contracts();
        })
        .on("click", ".logout", function (event) {
            event.preventDefault();
            navigator.notification.confirm(
                'Are you sure you want to logout?', // message
                function (buttonIndex) {
                    console.log(buttonIndex);
                    if (buttonIndex === 1) {
                        localStorage.clear();
                        $('.login-modal').modal({
                            backdrop: 'static',
                            keyboard: false,
                            show: true
                        });
                    }
                }, // callback to invoke with index of button pressed
                'Confirmation', // title
            ['Logout', 'Cancel'] // buttonLabels
            );

        })
        .on("submit", ".login-modal form", function (event) {
            event.preventDefault();

            var user = $('#usernamelogin').val();
            var pass = $('#passwordlogin').val();

            login(user, pass);
        })
        .on("click", ".innerlink", function (e) {
            e.preventDefault();

            var thislink = $(this);

            var link = $(this).attr('href');
            //alert( window.location.pathname );
            $('.innerlink').removeClass('active');
            $(this).addClass('active');
            var title = $(this).attr('title');
            $("#ajaxdata").remove();

            $("#main").load(link, function () {
                $('.navbar-fixed-top .navbar-brand').html(title);

                if (link == 'reports.html') {

                    var reportQ = "SELECT clientName, reportDate, reportTime, reportID, COUNT (obsItem) AS obss FROM report INNER JOIN client ON clientID = reportClient LEFT JOIN obs ON reportID = obsReport GROUP BY reportID ORDER BY reportDate ASC, reportTime ASC";
                    db.transaction(
                        function (tx) {
                            var output = '';
                            tx.executeSql(reportQ, [], function (tx, rs) {
                                for (var i = 0; i < rs.rows.length; i++) {
                                    var obsOut = rs.rows.item(i).obss + ' Observations';
                                    output += '<a href="report-detail.html" class="list-group-item view-report" rel="' + rs.rows.item(i).reportID + '"><h4 class="list-group-item-heading">' + rs.rows.item(i).clientName + '</h4><i class="pull-right glyphicon glyphicon-chevron-right"></i><p class="list-group-item-text">Produced ' + rs.rows.item(i).reportDate + ' at ' + rs.rows.item(i).reportTime + ' by User - ' + obsOut + '</p></a>';
                                }
                                $("#reportList").html(output);
                            }, errorCB);
                        }, errorCB);

                } else if (link == 'new-report.html' || link == 'admin.html') {
                    //console.log( loadtest );


                    if (loadtest == 0) {
                        reportPage();
                        loadtest++;
                    } else {
                        var obsArray = {};
                        setup_report_page();
                    }
                } else if (link == 'debug.html') {
                    debugPage();
                }

            });
        })
        .on("click", ".view-report", function (event) {
            event.preventDefault();
            var reportID = $(this).attr('rel');
            //console.log(reportID);
            $('.navbar-fixed-top .navbar-brand').html('Report Detail');
            $("#main").load("report-detail.html #ajaxdata", function (event) {
                reportDetail(reportID);
            });
        });
}

function debugPage() {
    var db = open_db();

    var userQuery = "SELECT * FROM user ORDER BY userName ASC";
    db.transaction(
        function (tx) {
            tx.executeSql(userQuery, [], function (tx, rs) {
                if (rs.rows.length !== 0) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        $('#debug_users tbody').append('<tr><td>' + rs.rows.item(i).userID + '</td><td>' + rs.rows.item(i).userName + '</td><td>' + rs.rows.item(i).userEmail + '</td><td>' + rs.rows.item(i).userPass + '</td><td>' + rs.rows.item(i).userType + '</td><td>' + rs.rows.item(i).userActive + '</td><td>' + rs.rows.item(i).userCreated + '</td><td>' + rs.rows.item(i).userUpdated + '</td></tr>');
                    }
                } else {
                    $('#debug_users tbody').append('<tr><td colspan="8">No records found</td></tr>');
                }
            }, errorCB);
        }, errorCB
    );

    var clientQuery = "SELECT * FROM client ORDER BY clientName ASC";
    //console.log( clientQuery );
    db.transaction(
        function (tx) {
            tx.executeSql(clientQuery, [], function (tx, rs) {
                if (rs.rows.length !== 0) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        $('#debug_client tbody').append('<tr><td>' + rs.rows.item(i).clientID + '</td><td>' + rs.rows.item(i).clientName + '</td><td>' + rs.rows.item(i).clientEmail + '</td><td>' + rs.rows.item(i).clientLogo + '</td><td>' + rs.rows.item(i).clientActive + '</td><td>' + rs.rows.item(i).clientCreated + '</td><td>' + rs.rows.item(i).clientUpdated + '</td></tr>');
                    }
                } else {
                    $('#debug_client tbody').append('<tr><td colspan="7">No records found</td></tr>');
                }
            }, errorCB);
        }, errorCB
    );

    var reportQuery = "SELECT * FROM report JOIN client ON clientID = reportClient JOIN user ON userID = reportUser ORDER BY reportDate DESC";
    //console.log( reportQuery );
    db.transaction(
        function (tx) {
            tx.executeSql(reportQuery, [], function (tx, rs) {
                if (rs.rows.length !== 0) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        $('#debug_reports tbody').append('<tr><td>' + rs.rows.item(i).reportID + '</td><td>' + rs.rows.item(i).clientName + '</th><td>' + rs.rows.item(i).reportContract + '</th><td>' + rs.rows.item(i).reportWork + '</th><td>' + rs.rows.item(i).reportDate + '</th><td>' + rs.rows.item(i).reportTime + '</th><td>' + rs.rows.item(i).reportTick + '</th><td>' + rs.rows.item(i).userName + '</th><td>' + rs.rows.item(i).reportClientSig + '</th><td>' + rs.rows.item(i).reportUserSig + '</th><td>' + rs.rows.item(i).reportCreated + '</th><td>' + rs.rows.item(i).reportUpdated + '</th></tr>');
                    }
                } else {
                    $('#debug_reports tbody').append('<tr><td colspan="12">No records found</td></tr>');
                }
            }, errorCB);
        }, errorCB
    );

    var contractsQuery = "SELECT * FROM contract JOIN client ON clientID = contractClient ORDER BY clientName ASC";
    //console.log( reportQuery );
    db.transaction(
        function (tx) {
            tx.executeSql(contractsQuery, [], function (tx, rs) {
                if (rs.rows.length !== 0) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        $('#debug_contracts tbody').append('<tr><td>' + rs.rows.item(i).contractID + '</td><td>' + rs.rows.item(i).clientName + '</th><td>' + rs.rows.item(i).contractNumber + '</th><td>' + rs.rows.item(i).contractLocation + '</th><td>' + rs.rows.item(i).contractActive + '</th><td>' + rs.rows.item(i).contractCreated + '</th><td>' + rs.rows.item(i).contractUpdated + '</th></tr>');
                    }
                } else {
                    $('#debug_contracts tbody').append('<tr><td colspan="12">No records found</td></tr>');
                }
            }, errorCB);
        }, errorCB
    );

}

function reportDetail(reportID) {
    var db = open_db();
    var query = 'SELECT * FROM report LEFT JOIN client ON clientID = reportClient LEFT JOIN contract ON contractID = reportContract WHERE reportID="' + reportID + '"';
    console.log(query);
    db.transaction(
        function (tx) {
            tx.executeSql(query, [], function (tx, rs) {

                console.log(rs.rows.item(0));
                $('#clientID').val(rs.rows.item(0).clientName);
                $('#clientContract').val(rs.rows.item(0).contractNumber);
                $('#clientWork').val(rs.rows.item(0).contractLocation);
                $('#reportDate').val(rs.rows.item(0).reportDate);
                $('#time').val(rs.rows.item(0).reportTime);
                $('.createpdf').attr('rel', rs.rows.item(0).reportID);
                $('.printform').attr('rel', rs.rows.item(0).reportID);
                //console.log(rs.rows.item(0).reportTick);
                var ticksString = rs.rows.item(0).reportTick.replace(',}', '}');
                var ticks = jQuery.parseJSON(ticksString);
                console.log(ticks);
                for (var x = 1; x <= 33; x++) {
                    if (ticks[x] > 0) {
                        $(".totalBox" + x).html(ticks[x]).css('background-color', 'red');
                    }
                }
            }, errorCB);
        }
    );
    $(document)
        .on("click", '.createpdf', function (e) {
            var fileTransfer = new FileTransfer();
            var report = $(this).attr('rel');
            var uri = encodeURI("http://sws.tailoreddev.co.uk/" + report + ".pdf");
            var fileURL = cordova.file.documentsDirectory + "/" + report + ".pdf";

            fileTransfer.download(
                uri,
                fileURL,
                function (entry) {
                    console.log("download complete: " + entry.toURL());



                    //cordova.InAppBrowser.open(entry.toURL(), '_blank', 'location=no');
                    window.open(entry.toURL(), '_blank', 'location=no,closebuttoncaption=Close,enableViewportScale=yes');
                },
                function (error) {
                    console.log("download error source " + error.source);
                    console.log("download error target " + error.target);
                    console.log("upload error code" + error.code);
                },
                false
            );
        })
        .on("click", ".printform", function (event) {
            event.preventDefault();
            //var page = $("html").html();

            var fileTransfer = new FileTransfer();
            var report = $(this).attr('rel');
            var uri = encodeURI("http://sws.tailoreddev.co.uk/" + report + ".pdf");
            var fileURL = cordova.file.documentsDirectory + "/" + report + ".pdf";

            fileTransfer.download(
                uri,
                fileURL,
                function (entry) {
                    console.log("download complete: " + entry.toURL());
                    console.log('In print');
                    cordova.plugins.printer.print(entry.toURL(), {
                        name: 'Report Detail',
                        greyscale: true
                    }, function () {
                        console.log('printing finished or canceled')
                    });
                },
                function (error) {
                    console.log("download error source " + error.source);
                    console.log("download error target " + error.target);
                    console.log("upload error code" + error.code);
                },
                false
            );


        });
    var obsQuery = 'SELECT *, COUNT( imageID ) as images FROM obs LEFT JOIN image ON imageObs = obsID WHERE obsReport="' + reportID + '" ORDER BY obsItem ASC';
    console.log(obsQuery);
    db.transaction(
        function (tx) {
            tx.executeSql(obsQuery, [], function (tx, rs) {
                if (rs.rows.length > 0) {
                    $('.swstable tr.nodata').remove();
                }
                for (var i = 0; i < rs.rows.length; i++) {
                    $('.swstable').append('<tr><td>' + rs.rows.item(i).obsItem + '</td><td>' + rs.rows.item(i).obsObs + '</td><td>' + rs.rows.item(i).obsPriority + '</td><td>' + rs.rows.item(i).images + '</td></tr>');
                }
            }, errorCB);
        }, errorCB
    );

}
var sigCapture = null;

function setup_report_page() {

    $(".bsswitch").bootstrapSwitch({
        onText: 'Yes',
        offText: 'No',
        onColor: 'success',
        offColor: 'danger'
    });

    var db = open_db();
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes() < 10 ? '0' : '';
    m += d.getMinutes();
    var day = d.getDate();
    if (day < 10) {
        day = "0" + day;
    }
    var month = d.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var year = d.getFullYear();

    var clientQ = "SELECT * FROM client ORDER BY clientName ASC";
    db.transaction(
        function (tx) {
            var output = '<option readonly disabled selected>Select Client</option>';
            tx.executeSql(clientQ, [], function (tx, rs) {
                for (var i = 0; i < rs.rows.length; i++) {
                    output += '<option value="' + rs.rows.item(i).clientID + '">' + rs.rows.item(i).clientName + '</option>';
                }
                $("#clientID").html(output);
            }, errorCB);
        }, errorCB);

    $('.datepicker').val(day + '/' + month + '/' + year);

    $('#time').val(h + ':' + m);
    sigCapture = null;
}

function reportPage() {
    var db = open_db();
    var obsArray = {};
    var totalObs = 0;

    setup_report_page();


    $(document).ready(function (e) {

        sigCapture = new SignatureCapture("signature");
    });

    $(document)

    .on("click", ".clearsig", function (event) {
        event.preventDefault();
        sigCapture.clear();
    })

    .on("change", "#reportform #clientID", function () {
            var clientID = $(this).val();
            var clientQ = "SELECT * FROM contract WHERE contractClient='" + clientID + "' ORDER BY contractNumber ASC";
            db.transaction(
                function (tx) {
                    var output = '<option readonly disabled selected>Select Contract</option>';
                    tx.executeSql(clientQ, [], function (tx, rs) {
                        if (rs.rows.length > 0) {
                            for (var i = 0; i < rs.rows.length; i++) {
                                output += '<option data-location="' + rs.rows.item(i).contractLocation + '" value="' + rs.rows.item(i).contractID + '">' + rs.rows.item(i).contractNumber + ' (' + rs.rows.item(i).contractLocation + ')</option>';
                            }
                        } else {
                            output += '<option readonly disabled selected>No contracts for this client</option>';
                        }
                        $("#clientContract").html(output);
                    }, errorCB);
                }, errorCB);

        })
        .on("change", '#reportform #clientContract', function () {
            var contractLoc = $(this).find(':selected').attr('data-location');
            console.log(contractLoc);
            $('#clientWork').val(contractLoc);
        })
        .on("click", ".newrep_nextstep", function (e) {
            e.preventDefault();
            var errors = 0;
            if ($('#reportform #clientID').val() === '-1') {
                errors++;
            }
            if ($('#reportform #clientContract').val() === '') {
                errors++;
            }
            if ($('#reportform #clientWork').val() === '') {
                errors++;
            }
            if (typeof ($('#reportform input[name=clientPrevAvail]:checked:first').val()) === 'undefined') {
                errors++;
                console.log('avail error');
            }
            if (typeof ($('#reportform input[name=clientPrevAction]:checked:first').val()) === 'undefined') {
                errors++;
                console.log('action error');
            }
            if ($('#reportform #reportDate').val() === '') {
                errors++;
            }
            if ($('#reportform #reportTime').val() === '') {
                errors++;
            }
            if (errors === 0) {
                console.log('no errors');
                $(this).remove();
                $('.step2').hide().removeClass('hidden').show();
            }
        })
        .on("click", ".printform", function (event) {
            event.preventDefault();
            //var page = $("html").html();

            var fileTransfer = new FileTransfer();
            var report = $(this).attr('rel');
            var uri = encodeURI("http://sws.tailoreddev.co.uk/" + report + ".pdf");
            var fileURL = cordova.file.documentsDirectory + "/" + report + ".pdf";

            fileTransfer.download(
                uri,
                fileURL,
                function (entry) {
                    console.log("download complete: " + entry.toURL());
                    console.log('In print');
                    cordova.plugins.printer.print(page, {
                        name: 'Report Detail',
                        greyscale: true
                    }, function () {
                        console.log('printing finished or canceled')
                    });
                },
                function (error) {
                    console.log("download error source " + error.source);
                    console.log("download error target " + error.target);
                    console.log("upload error code" + error.code);
                },
                false
            );


        })
        .on("click", ".addsig", function (event) {
            event.preventDefault();

            var fields = {
                'sig': 'data:image/png; base64,' + sigCapture.toString(),
                'report': $('.sigReportID').val(),
            };
            if (document.getElementById('signature').toDataURL() !== document.getElementById('blank').toDataURL()) {
                $('.signature1').modal('hide');
                var query = "UPDATE report SET reportClientSig=? WHERE reportID=?";
                //console.log( query );
                //console.log (fields );
                // Add signature image to database
                db.transaction(
                    function (tx) {
                        tx.executeSql(query, [fields.sig, fields.report], function (tx, rs) {
                            //console.log("updated:" + fields.report);
                            var title = $('a.dashboard').attr('title');
                            $("#main").load('dashboard.html', function () {
                                $('.navbar-fixed-top .navbar-brand').html(title);
                            });
                            navigator.notification.alert(
                                'Your report was successfully added.',
                                function () {},
                                'Report Added',
                                'OK'
                            );
                        }, errorCB);
                    }, errorCB
                );
                $('.sigimg').attr('src', 'data:image/png; base64,' + sigCapture.toString());
                sigCapture.clear();
            } else {
                navigator.notification.alert(
                    'You have not signed the form.',
                    function () {},
                    'Error',
                    'Try Again'
                );
            }

        })

    .on("click", '.subreport', function (e) {
            e.preventDefault();
            $(this).attr('disabled', 'disabled');
            $('#reportform').submit();
        })
        .on("submit", "#reportform", function (event) {
            event.preventDefault();

            var result = {};
            $.each($(this).serializeArray(), function () {
                result[this.name] = this.value;
            });
            var ticked = '{';
            for (var i = 1; i <= 33; i++) {
                if (i === 33) {
                    ticked += '"' + i + '":"' + result["inlineCheckbox[" + i + "]"] + '"';
                } else {
                    ticked += '"' + i + '":"' + result["inlineCheckbox[" + i + "]"] + '",';
                }
            }
            ticked += '}';
            var reportID = generateUUID();
            var query = "INSERT INTO report (reportID, reportClient, reportWork, reportContract, reportDate, reportTime, reportTick, reportUser, reportPrevAvail, reportPrevAction ) VALUES (?,?,?,?,?,?,?,?,?,?)";
            db.transaction(
                function (tx) {
                    var reportDate = result.reportDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3/$2/$1");
                    tx.executeSql(query, [reportID, result.reportClient, result.reportWork, result.reportContract, reportDate, result.reportTime, ticked, window.localStorage.userID, result.clientPrevAvail, result.clientPrevAction], function (tx, rs) {


                        //var obsID = $('.obsID').val();

                        $.each(obsArray, function () {
                            //console.log(this);
                            var obsID = this.obsID;
                            var obsQuery = "INSERT INTO obs (obsReport, obsID, obsItem, obsObs, obsPriority) VALUES ('" + reportID + "','" + obsID + "','" + this.obsItem + "','" + this.obsObs + "','" + this.obsPriority + "')";
                            //console.log( this.obsImage.length );
                            $.each(this.images, function () {
                                var imageID = generateUUID();
                                var imageData = this;
                                var imageQuery = "INSERT INTO image (imageID, imageObs, imageData) VALUES ('" + imageID + "','" + obsID + "','" + imageData + "')";
                                tx.executeSql(imageQuery, [], function (tx, rs) {
                                    if (online === 1) {
                                        ajax_insert_image(imageID, obsID, imageData);
                                    }
                                    console.log('inserted image:' + imageID);
                                }, errorCB);
                            });
                            //console.log ( obsQuery );
                            //var obvsID = generateUUID();

                            var obsItem = this.obsItem;
                            var obsObs = this.obsObs;
                            var obsPriority = this.obsPriority;

                            tx.executeSql(obsQuery, [], function (tx, rs) {
                                if (online === 1) {
                                    ajax_insert_obs(reportID, obsID, obsItem, obsObs, obsPriority);
                                }
                                console.log('inserted obs:' + obsID);
                            }, errorCB);

                        });

                        if (online === 1) {
                            ajax_insert_report(reportID, result.reportClient, result.reportWork, result.reportContract, reportDate, result.reportTime, ticked, window.localStorage.userID, result.clientPrevAvail, result.clientPrevAction);
                        }

                        console.log("inserted report:" + reportID);
                        $(".sigReportID").val(reportID);
                        $('.signature1').modal('show');
                    }, errorCB);
                }, errorCB
            );
            $('.subreport').removeAttr('disabled');

        })
        .on("click", ".tickboxes .addObsButton", function (e) {
            e.preventDefault();
            var arrayid = generateUUID();
            $("#newObs .obsID").val(arrayid);
            var obsID = $("#newObs .obsID").val();
            //obsArray[obsID] = {};
            var str = $(this).attr('rel');
            var str2 = $(this).attr('data-title');
            $(".newobs #obsItem").val(str);
            $(".newobs #obsName").val(str2);
            $('#newObs input[text]').val('');
            $('#newObs textarea').val('');
            $("#newObs .obsImages").val('0');
            $('.media div').remove();
            $('#newObs .obsPriority').val('null');
            $('.newobs').modal({
                backdrop: 'static',
                keyboard: false,
                show: true
            });
            //$(".newobs").modal("show");
            $('.addobssub').removeAttr('disabled');
        })
        .on("click", ".addobssub", function (e) {
            $(this).attr('disabled', 'disabled');
            $('#newObs').submit();
        })
        .on("submit", "#newObs", function (e) {
            e.preventDefault();
            $(".nodata").remove();
            var result = {};
            result.images = [];
            var error = 0;
            $.each($(this).serializeArray(), function () {
                if (this.name === 'obsImage[]') {
                    result.images.push(this.value);
                    //console.log(this.value);
                } else {
                    result[this.name] = this.value;
                }
            });
            if ( result.obsPriority === 'null' ) {
                //alert("Please select a priority");
                error++;
            }
            if (result.obsObs == "") {
                //alert("Please enter an observation");
                error++;
            }
            if (error == 0) {
                var obsID = result.obsID;
                if (typeof obsArray === 'undefined') {
                    obsArray = {};
                    //obsArray[obsID] = [];
                }
                obsArray[obsID] = {};
                obsArray[obsID] = result;
                //obsArray[obsID].push(result);
                //console.log(obsArray[obsID]);
                var priorityClass = result.obsPriority.split(" ");
                priorityClass = 'priority_' + priorityClass[0];
                var output = '<tr id=' + obsID + '><td>' + result.obsItem + '</td><td>' + result.obsObs + '</td><td class="' + priorityClass + '">' + result.obsPriority + '</td><td>' + result.obsImages + '</td><td><button type="button" rel="' + obsID + '" class="btn btn-primary btn-xs editObs"><span class="glyphicon glyphicon-pencil"></span></button> <button type="button" rel="' + obsID + '" data-item="' + result.obsItem + '" class="btn btn-danger btn-xs delObs"><span class="glyphicon glyphicon-trash"></span></button></td></tr>';
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
                $('#newObs').trigger("reset");
                totalObs = totalObs + 1;
                //console.log('end');
            }
            $('.addobssub').removeAttr('disabled');
            //console.log(obsArray);
        })
        .on( 'click', '.delObs', function(e) {
            var delObs = $(this);
            var obsKey = delObs.attr('rel');
            var obsItem = delObs.data( 'item' );
            navigator.notification.confirm(
                'Are you sure, this is non-reversible.', 
                 function( buttonIndex) {
                     if( buttonIndex == 1 ) {
                        console.log( 'Deleting ' + obsItem );
                        $( 'tr#'+obsKey ).remove();
                        delete obsArray[obsKey]; 
                        var curr = $('.totalBox' + obsItem).html();
                        $('.totalBox' + obsItem).html(+curr - 1);
                        if( $( '.totalbox'+ obsItem ).html() == 0 ) {
                            $(this).css('background-color', 'black')
                        }
                        $('#inlineCheckbox' + obsItem).val(+curr - 1);
                        console.log( 'Deleted ' + obsKey );
                     }
                 },            
                'Confirm',     
                ['Yes','No']    
            );   
            e.preventDefault();                
        })
        .on("click", ".editObs", function (e) {
            e.preventDefault();
            var editObs = $(this);
            var obsKey = editObs.attr('rel');
            var obs = obsArray[obsKey];
            //console.log( obsArray[obsKey] ); 
            $('#editobsItem').val(obs.obsItem);
            $('#editobsName').val(obs.obsName);
            $('#editobsPriority').val(obs.obsPriority);
            $('#editobsObs').text(obs.obsObs);
            $('#editobsID').val(obs.obsID);
            $.each(obs.images, function (i, image) {
                //console.log( image );
                $("#editmedia").append('<div class="col-sm-2"><a href="#" class="removemedia"><span class="glyphicon glyphicon-remove"></span></a><img src="' + image + '" /></div><input type="hidden" name="editobsImage[]" value="data:image/jpeg;base64,' + image + '" />');
            });
            $('.editobs').modal({
                backdrop: 'static',
                keyboard: false,
                show: true
            });
            //$(".editobs").modal("show");
        })
        .on("click", ".editobssub", function (e) {
            $(this).attr('disabled', 'disabled');
            $('#editObs').submit();
        })
        .on("submit", "#editObs", function (e) {
            e.preventDefault();
            var result = {};
            result.images = [];
            var error = 0;
            $.each($(this).serializeArray(), function () {
                if (this.name === 'editobsImage[]') {
                    result.images.push(this.value);
                    //console.log(this.value);
                } else {
                    var key = this.name.replace('edit', '');
                    result[key] = this.value;
                }
            });
            //console.log( result );
            if (typeof result.obsPriority === 'undefined') {
                //alert("Please select a priority");
                error++;
            }
            if (result.obsObs == "") {
                //alert("Please enter an observation");
                error++;
            }
            if (error == 0) {
                var obsID = result.obsID;
                obsArray[obsID] = {};
                obsArray[obsID] = result;
                //obsArray[obsID].push(result);
                console.log(obsArray[obsID]);
                var priorityClass = result.obsPriority.split(" ");
                priorityClass = 'priority_' + priorityClass[0];
                var output = '<tr id="' + obsID + '"><td>' + result.obsItem + '</td><td>' + result.obsObs + '</td><td class="' + priorityClass + '">' + result.obsPriority + '</td><td>' + result.obsImages + '</td><td><button type="button" rel="' + obsID + '" class="btn btn-primary btn-xs editObs"><span class="glyphicon glyphicon-pencil"></span></button> <button class="btn btn-danger btn-xs"><span class="glyphicon glyphicon-trash"></span></button></td></tr>';

                $('.swstable tr#' + obsID).replaceWith(output);
                $(".editobs").modal("hide");
                $('#editObs').trigger("reset");
                $("#newObs .obsImages").val('0');
                $('.media div').remove();

                //console.log('end');
            }
            $('.editobssub').removeAttr('disabled');
            console.log(obsArray);
        })
        .on("click", ".addmedia", function (e) {
            e.preventDefault();
            navigator.camera.getPicture(onSuccess, onFail, {
                destinationType: Camera.DestinationType.DATA_URL,
                quality: 30,
                targetWidth: 800,
                targetHeight: 600,
                correctOrientation: true
            });
        })
        .on("click", ".addmedialib", function (e) {
            e.preventDefault();
            navigator.camera.getPicture(onSuccess, onFail, {
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY
            });
        })

    .on("click", ".removemedia", function (e) {
            e.preventDefault();
            $(this).parent().fadeOut(1000).remove();
        })
        .on('click', '.dropdown-menu.dropdown-menu-form', function (e) {
            e.stopPropagation();
        });

    function ajax_insert_obs(reportID, obsID, obsItem, obsObs, obsPriority) {
        var data = {
            obsReport: reportID,
            obsID: obsID,
            obsItem: obsItem,
            obsObs: obsObs,
            obsPriority: obsPriority,
        };
        $.post('http://sws.tailoreddev.co.uk/ajax/add-obs.php', data, function (data) {

        }, 'json');
    }

    function ajax_insert_report(reportID, reportClient, reportWork, reportContract, reportDate, reportTime, reportTick, reportUser, reportAction, reportAvail) {

        var data = {
            reportID: reportID,
            reportClient: reportClient,
            reportWork: reportWork,
            reportContract: reportContract,
            reportDate: reportDate,
            reportTime: reportTime,
            reportTick: reportTick,
            reportUser: reportUser,
            reportPrevAvail: reportAvail,
            reportPrevAction: reportAction
        };
        //console.log ( data );
        $.post('http://sws.tailoreddev.co.uk/ajax/add-report.php', data, function (data) {

        }, 'json');
    }

    function ajax_insert_image(imageID, obsID, imageData) {
        var data = {
            imageID: imageID,
            imageObs: obsID,
            imageData: imageData,
        };
        //console.log ( data );
        $.post('http://sws.tailoreddev.co.uk/ajax/add-image.php', data, function (data) {

        }, 'json');
    }

    function onSuccess(imageData) {
        var i = $("#newObs .obsImages").val();
        $(".media").append('<div class="col-sm-2"><a href="#" class="removemedia"><span class="glyphicon glyphicon-remove"></span></a><img src="data:image/jpeg;base64,' + imageData + '" /></div><input type="hidden" name="obsImage[]" value="data:image/jpeg;base64,' + imageData + '" />');
        //$(".media").append('<div class="col-sm-2"><a href="#" class="removemedia"><span class="glyphicon glyphicon-remove"></span></a><img src="data:image/jpeg;base64,IMAGE DATA HERE" /></div><input type="hidden" name="obsImage[]" value="data:image/jpeg;base64,IMAGE DATA HERE" />');
        i = +i + 1;
        $("#newObs .obsImages").val(i);
    }


    function onFail(message) {
        alert('Failed because: ' + message);
    }

}
