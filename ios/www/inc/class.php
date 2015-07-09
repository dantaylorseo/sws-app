<?php
	class mySQL
	{
		var $db = array(
			"db_user" => "client_sws",
			"db_name" => "client_sws",
			"db_host" => "localhost",
			"db_pass" => "#s.o;qp~i&*@");
		var $error = array();
		var $count = 0;
		var $con = '';
		
		function __construct()
		{
			$this->connect();
		}
		
		function connect()
		{
			$this->conn = mysql_connect($this->db['db_host'], $this->db['db_user'], $this->db['db_pass'])
			OR $this->error(1,'Can\'t Connect To MySQL Server.');
			
			mysql_select_db($this->db['db_name'], $this->conn)
			OR $this->error(1, "Can't Select MySQL Database");	
			
			return $this->conn;
		}
		
		function query($sql)
		{
			$this->query_id = mysql_query($sql, $this->conn)
			OR $this->error(1, mysql_error().' - '.$sql);
			return $this->query_id;
		}
		
		function fetch($query)
		{
			$this->query2 = array();
			while($this->query1 = mysql_fetch_assoc($query))
			{
				$this->query2[] = $this->query1;
			}
			
			return $this->query2;
		}
		function sanitize($string) {
			$out = mysql_real_escape_string($string);
			$out = htmlentities($out);
			return $out;	
		}
		function queryID($sql) {
			$this->query_id = mysql_query($sql, $this->conn)
			OR $this->error(1, mysql_error().' - '.$sql);
			return mysql_insert_id();
		}
		
		function num($query)
		{
	 		$query = mysql_num_rows($query);
	 		return $query;
	 	}
		
		function error($error, $quote) {
			if($error = 1)
			{
				die($quote);	
			}
		}
	}