<?php
	require('../inc/class.php');
	$db = new mySQL();
	
	foreach($_POST as $key=>$value) {
		$clean[$key] = $db->sanitize($value);	
	}
	
	$query = "INSERT INTO client SET clientName='$clean[clientNamem]', clientWork='$clean[clientLocationm]', clientContract='$clean[clientContractm]'";
	if($result = $db->query($query)) {
		$array = array('status' => 1, 'data' => array('clientID' => mysql_insert_id(), 'clientName' => $_POST['clientNamem'], 'clientLocation' => $_POST['clientLocationm'], 'clientContract' => $_POST['clientContractm']), 'timestamp' => time());
	} else {
		$array = array('status' => 0, 'data' => '', 'timestamp' => time(), 'error' => 'MySQL Insert Failed');	
	}
	
	echo json_encode($array);