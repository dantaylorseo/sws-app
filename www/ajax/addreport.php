<?php
	require('../inc/class.php');
	$db = new mySQL();
	// Sanitize data to reduce malicous input 
	foreach($_POST as $key=>$value) {
		if(!is_array($value)) {
			$clean[$key] = $db->sanitize($value);	
		} else {
			foreach($value as $key2=>$value2) {
				$clean[$key][$key2] = $db->sanitize($value2);	
			}
		}
	}
	
	// Serialise tickbox data
	for($i=1; $i<=32; $i++) {
		$var = 'inlineCheckbox'.$i;
		$tickbox[$i] = $clean[$var];
	}
	
	$clean['reportTick'] = json_encode($tickbox);
	
	foreach($clean as $key=>$value) {
		echo "$key = $value\r\n";	
	}
	
	$array = array('status' => 1, 'data' => 'This is the result', 'timestamp' => time());
	
	//echo json_encode($array);