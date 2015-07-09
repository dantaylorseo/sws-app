<?php
	require('../inc/class.php');
	$db = new mySQL();
	$query = "SELECT * FROM client WHERE clientID='$_POST[client]' LIMIT 1";
	$result = $db->query($query);
	$a = mysql_fetch_assoc($result);					
	
	$array = array('status' => 1, 'data' => array('clientID' => $a['clientID'], 'clientName' => $a['clientName'], 'clientLocation' => $a['clientWork'], 'clientContract' => $a['clientContract']), 'timestamp' => time());
	
	echo json_encode($array);