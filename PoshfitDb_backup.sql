-- MySQL dump 10.13  Distrib 5.5.45, for Linux (x86_64)
--
-- Host: localhost    Database: PoshfitDb
-- ------------------------------------------------------
-- Server version	5.5.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


create database PoshfitDb;
--
-- Table structure for table `activityLog`
--

DROP TABLE IF EXISTS `activityLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activityLog` (
  `activity_id` int(11) NOT NULL ,
  `duration` int(11) NOT NULL,
  `date` datetime DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  KEY `activity_id` (`activity_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `activityLog_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activityMetadata` (`id`),
  CONSTRAINT `activityLog_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teamMetadata` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activityLog`
--

LOCK TABLES `activityLog` WRITE;
/*!40000 ALTER TABLE `activityLog` DISABLE KEYS */;
/*!40000 ALTER TABLE `activityLog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activityMetadata`
--

DROP TABLE IF EXISTS `activityMetadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activityMetadata` (
  `id` int(11) NOT NULL  PRIMARY KEY,
  `Category` varchar(40) NOT NULL,
  `Activity` varchar(40) NOT NULL,
  `Points` int(11) NOT NULL,
  `Duration` int(11) NOT NULL

) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activityMetadata`
--

LOCK TABLES `activityMetadata` WRITE;
/*!40000 ALTER TABLE `activityMetadata` DISABLE KEYS */;
INSERT INTO `activityMetadata` VALUES (1,'Well-Being','Floss Teeth',1,0),(2,'Well-Being','7 or More Hours of Sleep',1,0),(3,'Well-Being','Less than 30 Mins of TV',1,0),(4,'Well-Being','No Smoking ',1,0),(5,'Consumption','Fruits & Vegetables (At Least 4 Veggie)',5,0),(6,'Consumption','Apple',1,0),(7,'Consumption','No fried foods',2,0),(8,'Consumption','No Soda',2,0),(9,'Consumption','No sugar',2,0),(10,'Physical Activity','Aerobics',3,60),(11,'Physical Activity','Basketball',3,60),(12,'Physical Activity','Calisthenics ',2,60),(13,'Physical Activity','Commuter Biking ',3,60),(14,'Physical Activity','\"Crossfit',0,0),(15,'Physical Activity','Gardening',1,30),(16,'Physical Activity','Golfing',1,60),(17,'Physical Activity','Jogging ',3,60),(18,'Physical Activity','Leisure Walking ',1,60),(19,'Physical Activity','Paddleboard ',2,60),(20,'Physical Activity','Power Yoga ',3,60),(21,'Physical Activity','Racquetball / Squash ',3,60),(22,'Physical Activity','Reading ',1,60),(23,'Physical Activity','Rockclimbing',2,60),(24,'Physical Activity','Rowing ',4,60),(25,'Physical Activity','Running (>6.5 MPH) ',4,60),(26,'Physical Activity','Soccer ',4,60),(27,'Physical Activity','Stairclimbing / Elliptical ',4,60),(28,'Physical Activity','Stretching ',1,60),(29,'Physical Activity','Tennis ',3,60),(30,'Physical Activity','Tour Biking',4,60),(31,'Physical Activity','Walking Fast (>3.5 MPH) ',2,60),(32,'Physical Activity','Weight Training',2,60),(33,'Physical Activity','Yoga / Pilates ',2,60),(34,'Physical Activity','Dancing ',2,60),(35,'Physical Activity','Ultimate Frisbee ',3,60),(36,'Physical Activity','Volleyball ',2,60),(37,'Physical Activity','Zumba',3,60),(38,'Physical Activity','Swimming ',4,60),(39,'Physical Activity','Baseball/Softball ',2,60),(40,'Physical Activity','Circus/Trampoline/Acrobatics',2,60),(41,'Physical Activity','Skating ',3,60),(42,'Physical Activity','Snowshoeing ',3,60),(43,'Physical Activity','Football/Rugby ',3,60),(44,'Physical Activity','Surfing ',2,60),(45,'Physical Activity','Martial Arts ',2,60),(46,'Physical Activity','Wii/Kinect ',2,60);
/*!40000 ALTER TABLE `activityMetadata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teamMetadata`
--

DROP TABLE IF EXISTS `teamMetadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teamMetadata` (
  `id` int(11) NOT NULL  AUTO_INCREMENT PRIMARY KEY,
  `team_name` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teamMetadata`
--

LOCK TABLES `teamMetadata` WRITE;
/*!40000 ALTER TABLE `teamMetadata` DISABLE KEYS */;
/*!40000 ALTER TABLE `teamMetadata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userInfo`
--

DROP TABLE IF EXISTS `userInfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userInfo` (
  `id` int(11) NOT NULL  AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(40) NOT NULL,
  `password` varchar(40) NOT NULL,
  `team_id` int(11) DEFAULT NULL,
  KEY `team_id` (`team_id`),
  CONSTRAINT `userInfo_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teamMetadata` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

insert into teamMetaData (team_name) values ('test_team1');
insert into userInfo (email, password, team_id) values ('test1@poshmark.com', 'password', 1);

insert into teamMetaData (team_name) values ('test_team2');
insert into userInfo (email, password, team_id) values ('test2@poshmark.com', 'password', 1);

--
-- Dumping data for table `userInfo`
--

LOCK TABLES `userInfo` WRITE;
/*!40000 ALTER TABLE `userInfo` DISABLE KEYS */;
/*!40000 ALTER TABLE `userInfo` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2015-12-24 19:41:47
