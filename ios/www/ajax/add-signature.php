<?php
	require('../inc/connect.php');
	$error = 0;
	
	$query = "UPDATE report SET reportSig=? WHERE reportID=?";
	
	if ($res1 = $db->prepare($query)) {
		$res1->bind_param('ss', $_POST['sig'], $_POST['report']);
		$res1->execute(); 
		$reportID = $res1->insert_id;
		$res1->close();
	} else {
		$error ++;
	}
	
	if($error == 0) {
		$array = array('status' => 1, 'data' => $reportID, 'timestamp' => time());
	} else {
		$array = array('status' => 0, 'data' => 'This is the result', 'error' => 'Report not inserted, please try again. '.$db->error, 'timestamp' => time());
	}
	
	echo json_encode($array);
	?>