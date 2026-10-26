import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (

    <SafeAreaView>
       <View style={styles.header}>
        <Text style={styles.appTitle}>NMSU Studyroom Rating App</Text>
        <Text style={styles.signIn}>Sign In</Text>
      </View>

      <ScrollView>
        <Text>Posts</Text>
           
          
            <View style={styles.locationCard}>
              <Text style={styles.locationName}>
                  Location Name
                </Text>

                <Text style={styles.rating}>
                  ⭐ 4/5
                </Text>
            </View>


            <View style={styles.locationCard}>
              <Text style={styles.locationName}>
                  Location Name
                </Text>

                <Text style={styles.rating}>
                  ⭐ 4/5
                </Text>
            </View>


            <View style={styles.locationCard}>
              <Text style={styles.locationName}>
                  Location Name
                </Text>

                <Text style={styles.rating}>
                  ⭐ 4/5
                </Text>
            </View>
      </ScrollView>

    </SafeAreaView>
      );
}

const styles = StyleSheet.create({
 appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
  },

  signIn: {
    color: '#8B1E2D',
    borderWidth: 1,
    borderColor: '#8B1E2D',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    fontSize: 12,
  },

    header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

    locationName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111111',
  },


  rating: {
    fontSize: 11,
    marginTop: 4,
    color: '#111111',
  },

  locationCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F1F2F5',
  borderWidth: 1,
  borderColor: '#D0D0D0',
  borderRadius: 10,
  padding: 7,
  marginBottom: 2,
  minHeight: 76,
},


})