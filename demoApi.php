<?php

error_reporting(0);

header('Access-Control-Allow-Origin: *');
header('Content-type: application/json');

if(isset($_GET['method']))
	switch($_GET['method']){

		case "login" :
			if($_POST['user'] == 'gion')
				echo json_encode(array(
					'success' => true,
					'result' => array(
						'id' => rand(1,1000),
						'username' => 'nickname'
					)
				));
			else
				echo json_encode(array(
					'success' => false,
					'message' => 'invalid credentials'
				));

			break;

		case "getLeagues" :
			$leagues = array();

			for($i=0;$i<6;$i++)
				{
					$leagues[$i] = array(
						'id' => $i,
						'rank' => rand(0,10),
						'score' => 100 * rand(0, 100),
						'name' => 'league #' . $i
					);
				}

			echo json_encode(array(
				'success' => true,
				'result' => $leagues
			));
			break;

		case "getLeagueDetails" : 
			$d = array();
			for($i=0;$i<rand(1,8);$i++)
				$d[] = randomGame();

			$result = array(
				'games' => $d,
				'timestamp' => time()
			);

			echo json_encode(array(
				'success' => true,
				'result' => $result
			));

			break;

		case "ranks" :
			$leagues = array();

			for($i=0;$i<20;$i++)
				{
					$leagues[$i] = array(
						'id' => $i,
						'rank' => rand(0,10),
						'score' => 100 * rand(0, 100),
						'name' => 'league #' . $i
					);
				}

			echo json_encode(array(
				'success' => true,
				'result' => $leagues
			));
			break;
	}
else
	echo json_encode(array(
		'success' => false,
		'message' => 'no valid method provided'
	));

function randomGame(){
	$namesString = "Big Test Icicles|Victorious Secret|The Cereal Killers|Soup-A-Stars|The Abusement Park|The Mighty Midgets|Scared Hitless|The Muffin Men|Slapnut Magoos";
	$names = explode('|',$namesString);

	$game = array(
		'teams' =>  array(
			'home' => array(
				'name' => $names[array_rand($names)],
				'score' => rand(0,50),
				'userScore' => rand(0,50)
			),
			'visitors' => array(
				'name' => $names[array_rand($names)],
				'score' => rand(0,50),
				'userScore' => rand(0,50)
			),
			'timestamp' => time() 
		)
	);

	return $game;
}