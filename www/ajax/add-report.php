<?php
	require('../inc/connect.php');
	$error = 0;
	
	for($i=1; $i<=32; $i++) {
		$var = 'inlineCheckbox'.$i;
		$tickbox[$i] = $_POST[$var];
	}
	$clean['reportTick'] = json_encode($tickbox);
	
	$date = split('/', $_POST['reportDate']);
	$date = $date[2].'-'.$date[1].'-'.$date[0];
	
	$query = "INSERT INTO report (reportClient, reportContract, reportWork, reportDate, reportTime, reportTick) values (?, ?, ?, ?, ?, ?)";
	$query2 = "INSERT INTO obs (obsReport,obsItem, obsObs,obsPriority) values (?, ?, ?, ?)";
	
	if ($res1 = $db->prepare($query)) {
		$res1->bind_param('isssss', $_POST['reportClient'], $_POST['reportContract'], $_POST['reportWork'], $date, $_POST['reportTime'], $clean['reportTick']);
		$res1->execute(); 
		$reportID = $res1->insert_id;
		$res1->close();
		if ($res2 = $db->prepare($query2)) {
			$res2->bind_param('isss', $reportID, $obsItem, $obsObs, $obsPriority);
			foreach($_POST['item'] as $key=>$value) {
				$obsItem = $value;
				$obsObs = $_POST['obs'][$key];
				$obsPriority = $_POST['priority'][$key];
				$res2->execute();	
			}
			$res2->close();
		} else {
			$error ++;
		}
	} else {
		$error ++;
	}
	
	if($error == 0) {
		$array = array('status' => 1, 'data' => $reportID, 'timestamp' => time());
	} else {
		$array = array('status' => 0, 'data' => 'This is the result', 'error' => 'Report not inserted, please try again.', 'timestamp' => time());
	}
	
	echo json_encode($array);
	?>