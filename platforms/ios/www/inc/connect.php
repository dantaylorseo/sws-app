<?php
	$login = array(
		"db_user" => "client_sws",
		"db_name" => "client_sws",
		"db_host" => "localhost",
		"db_pass" => "#s.o;qp~i&*@"
	);
	
	$db = new mysqli($login['db_host'], $login['db_user'], $login['db_pass'], $login['db_name']);
	
	if($db->connect_errno > 0){
		die('Unable to connect to database [' . $db->connect_error . ']');
	}
?>